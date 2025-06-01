package service

import (
	"context"
	"fmt"

	pb "backend/api/aigc/v1"
	"backend/internal/biz"
	"backend/internal/middleware"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

type ConversationService struct {
	pb.UnimplementedConversationServer
	convUc *biz.ConversationUsecase
}

func NewConversationService(convUc *biz.ConversationUsecase) *ConversationService {
	return &ConversationService{
		convUc: convUc,
	}
}

func (s *ConversationService) CreateConversation(ctx context.Context, req *pb.EmptyRequest) (*pb.CreateConversationReply, error) {
	email, _ := ctx.Value(middleware.CtxKeyEmail{}).(string)
	userID, err := s.convUc.GetUserIDByEmail(ctx, email)
	if err != nil {
		return &pb.CreateConversationReply{Code: 500, Message: "获取用户ID失败"}, nil
	}

	initialContext := []biz.Message{} // 初始上下文为空

	convID, err := s.convUc.Create(ctx, userID, initialContext)
	if err != nil {
		fmt.Println("创建会话失败:", err)
		return &pb.CreateConversationReply{Code: 500, Message: "创建会话失败"}, nil
	}

	// 将 convID 转换为字符串
	convIDStr := convID.Hex()

	return &pb.CreateConversationReply{
		Code:           200,
		Message:        "成功",
		ConversationId: convIDStr,
	}, nil
}

func (s *ConversationService) GetConversation(ctx context.Context, req *pb.EmptyRequest) (*pb.GetConversationReply, error) {
	email, _ := ctx.Value(middleware.CtxKeyEmail{}).(string)
	fmt.Println("当前用户email:", email)

	userID, err := s.convUc.GetUserIDByEmail(ctx, email)
	if err != nil {
		return &pb.GetConversationReply{Code: 500, Message: "获取用户ID失败"}, nil
	}

	convIDs, err := s.convUc.ListConversationsByUserID(ctx, userID)
	if err != nil {
		return &pb.GetConversationReply{Code: 500, Message: "获取会话列表失败"}, nil
	}

	data := []*pb.ConversationData{}
	fmt.Println("convIDs", convIDs)
	for _, id := range convIDs {
		conversation, err := s.convUc.GetConversation(ctx, id)
		if err != nil {
			return &pb.GetConversationReply{Code: 500, Message: "获取会话失败"}, nil
		}

		var calMessage string
		if len(conversation) > 0 {
				calMessage = conversation[0].Content
		} else {
				calMessage = ""
		}
		data = append(data, &pb.ConversationData{
			Cid: id.Hex(),
			CalMessage: calMessage,
		})
	}

	return &pb.GetConversationReply{
		Code:            200,
		Message:         "成功",
		Data: data,
	}, nil
}

func (s *ConversationService) GetConversationContext(ctx context.Context, req *pb.GetConversationContextRequest) (*pb.GetConversationContextReply, error) {
	convID, err := primitive.ObjectIDFromHex(req.ConversationId)
	if err != nil {
			return &pb.GetConversationContextReply{Code: 400, Message: "无效的会话ID"}, nil
	}

	contextData, err := s.convUc.GetContext(ctx, convID)
	if err != nil {
			return &pb.GetConversationContextReply{Code: 500, Message: "获取会话上下文失败"}, nil
	}

	var contextMessages []*pb.ContextData
	for _, msg := range contextData {
			contextMessages = append(contextMessages, &pb.ContextData{
				Role: msg.Role,
				Content: msg.Content,
			})
	}

	return &pb.GetConversationContextReply{
			Code:    200,
			Message: "成功",
			Context: contextMessages,
	}, nil
}
