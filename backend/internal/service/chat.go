package service

import (
	"bytes"
	"context"
	"encoding/json"
	"net/http"
	"time"

	pb "backend/api/aigc/v1"

	"backend/internal/biz"
	"backend/internal/conf"

	"go.mongodb.org/mongo-driver/bson/primitive"
	"backend/internal/middleware"
	"bufio"
	"fmt"
)

type ChatService struct {
	pb.UnimplementedChatServer
	convUc *biz.ConversationUsecase
	conf *conf.Bootstrap
}

func NewChatService(convUc *biz.ConversationUsecase, conf *conf.Bootstrap) *ChatService {
	return &ChatService{
		convUc: convUc,
		conf:   conf,
	}
}

type DeepseekRequest struct {
	Messages []biz.Message `json:"messages"`
	Model    string        `json:"model"`
	Stream   bool          `json:"stream"`
}

// 新增完整的流式响应结构体，包含服务端返回的所有字段
type DeepseekChunkResponse struct {
	ID                string `json:"id"`
	Object            string `json:"object"`
	Created           int64  `json:"created"`
	Model             string `json:"model"`
	SystemFingerprint string `json:"system_fingerprint,omitempty"`
	Choices           []struct {
		Index        int     `json:"index"`
		Delta        biz.Message `json:"delta"`                   // 流式响应中的增量内容
		Logprobs     any     `json:"logprobs,omitempty"`      // 使用any兼容null
		FinishReason string  `json:"finish_reason,omitempty"` // 结束原因
	} `json:"choices"`
}

func (s *ChatService) Chat(ctx context.Context, req *pb.ChatRequest) (*pb.ChatReply, error) {
	var convID primitive.ObjectID
	var err error

	email, _ := ctx.Value(middleware.CtxKeyEmail{}).(string)
	userID, err := s.convUc.GetUserIDByEmail(ctx, email)
	if err != nil {
		return &pb.ChatReply{Code: 500, Message: "获取用户ID失败"}, nil
	}

	fmt.Println("req", req.ConversationId)

	if req.ConversationId == "" {
		// 创建新会话
		convID, err = s.convUc.Create(ctx, userID, []biz.Message{})
		if err != nil {
			return &pb.ChatReply{Code: 500, Message: "创建会话失败"}, nil
		}
	} else {
		convID, err = primitive.ObjectIDFromHex(req.ConversationId)
		fmt.Println("convID", convID)
		if err != nil {
			return &pb.ChatReply{Code: 400, Message: "无效的会话ID"}, nil
		}
	}

	// 获取会话上下文
	contextData, err := s.convUc.GetContext(ctx, convID)
	fmt.Println("contextData", contextData)
	if err != nil {
		return &pb.ChatReply{Code: 500, Message: "获取会话上下文失败"}, nil
	}

	messages := append(contextData, biz.Message{
		Role:    "user",
		Content: req.Message,
	})

	// 将上下文添加到请求中
	deepseekReq := DeepseekRequest{
		Model:    "deepseek-chat",
		Messages: messages,
		Stream:   true,
	}

	reqJSON, err := json.Marshal(deepseekReq)
	if err != nil {
		return &pb.ChatReply{Code: 500, Message: "请求编码失败"}, nil
	}

	httpReq, err := http.NewRequest("POST", s.conf.Deepseek.Endpoint, bytes.NewBuffer(reqJSON))
	if err != nil {
		return &pb.ChatReply{Code: 500, Message: "创建HTTP请求失败"}, nil
	}
	httpReq.Header.Set("Content-Type", "application/json")
	httpReq.Header.Set("Authorization", "Bearer "+s.conf.Deepseek.ApiKey)

	ctx, cancel := context.WithTimeout(context.Background(), 120*time.Second)
	defer cancel()
	httpReq = httpReq.WithContext(ctx) // 关联上下文

	client := &http.Client{}
	resp, err := client.Do(httpReq)
	if err != nil {
		return &pb.ChatReply{Code: 500, Message: "HTTP请求失败"}, nil
	}
	defer resp.Body.Close()

	scanner := bufio.NewScanner(resp.Body) // 使用scanner按行读取
	var streamData string

	for scanner.Scan() { // 逐行处理流式数据
		line := scanner.Text()
		if len(line) < 6 || line[:6] != "data: " { // 忽略非数据行（如心跳包）
			continue
		}

		jsonData := line[6:]      // 提取"data: "后的内容
		if jsonData == "[DONE]" { // 处理结束标志（可能需要根据实际API调整）
			break
		}

		var chunkResp DeepseekChunkResponse
		if err := json.Unmarshal([]byte(jsonData), &chunkResp); err != nil {
			continue // 跳过解析失败的块，避免阻塞
		}

		for _, choice := range chunkResp.Choices {
			if choice.Delta.Content != "" {
				streamData += choice.Delta.Content
			}
		}
	}

	if err := scanner.Err(); err != nil { // 处理scanner错误
		return &pb.ChatReply{Code: 500, Message: "流式读取错误"}, nil
	}

	if streamData == "" {
		return &pb.ChatReply{Code: 500, Message: "Deepseek流式响应无有效内容"}, nil
	}

	
	// 持久化更新后的上下文
	messages = append(messages, biz.Message{
		Role:    "assistant",
		Content: streamData,
	})
	if err := s.convUc.UpdateContext(ctx, convID, messages); err != nil {
		return &pb.ChatReply{Code: 500, Message: "更新会话上下文失败"}, nil
	}

	return &pb.ChatReply{Code: 200, Message: "请求成功", Data: &pb.ChatData{
		ConversationId: convID.Hex(),
		Content:        streamData,
	}}, nil
}
