package service

import (
	// "bytes"
	"context"
	// "encoding/json"
	// "net/http"
	// "time"

	pb "backend/api/aigc/v1"

	"backend/internal/biz"

	// "go.mongodb.org/mongo-driver/bson/primitive"
)

type ChatService struct {
	pb.UnimplementedChatServer
	convUc *biz.ConversationUsecase
}

func NewChatService(convUc *biz.ConversationUsecase) *ChatService {
	return &ChatService{
		convUc: convUc,
	}
}

type DeepseekRequest struct {
	Messages []biz.Message `json:"messages"`
	Model    string        `json:"model"`
	Stream   bool          `json:"stream"`
}

func (s *ChatService) Chat(ctx context.Context, req *pb.ChatRequest) (*pb.ChatReply, error) {
	// convID, err := primitive.ObjectIDFromHex(req.ConversationId)
	// if err != nil {
	// 	return &pb.ChatReply{Code: 400, Message: "无效的会话ID"}, nil
	// }

	// // 获取会话上下文
	// contextData, err := s.convUc.GetContext(ctx, convID)
	// if err != nil {
	// 	return &pb.ChatReply{Code: 500, Message: "获取会话上下文失败"}, nil
	// }

	// messages := append(contextData, biz.Message{
	// 	Role:    "user",
	// 	Content: req.Message,
	// })

	// // 将上下文添加到请求中
	// deepseekReq := DeepseekRequest{
	// 	Model:    "deepseek-chat",
	// 	Messages: messages,
	// 	Stream:   true,
	// }

	// reqJSON, err := json.Marshal(deepseekReq)
	// if err != nil {
	// 	return &pb.ChatReply{Code: 500, Message: "请求编码失败"}, nil
	// }

	// httpReq, err := http.NewRequest("POST", s.conf.Endpoint, bytes.NewBuffer(reqJSON))
	// if err != nil {
	// 	return &pb.ChatReply{Code: 500, Message: "创建HTTP请求失败"}, nil
	// }
	// httpReq.Header.Set("Content-Type", "application/json")
	// httpReq.Header.Set("Authorization", "Bearer "+s.conf.ApiKey)

	// ctx, cancel := context.WithTimeout(context.Background(), 120*time.Second)
	// defer cancel()
	// httpReq = httpReq.WithContext(ctx) // 关联上下文

	// client := &http.Client{}
	// resp, err := client.Do(httpReq)
	// if err != nil {
	// 	return &pb.ChatReply{Code: 500, Message: "HTTP请求失败"}, nil
	// }
	// defer resp.Body.Close()

	return &pb.ChatReply{}, nil
}
