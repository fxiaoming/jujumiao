package service

import (
	"context"

	pb "backend/api/aigc/v1"
	"backend/internal/biz"

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

func (s *ConversationService) CreateConversation(ctx context.Context, req *pb.CreateConversationRequest) (*pb.CreateConversationReply, error) {
	userIDStr := ctx.Value("userID").(string) // 假设用户ID从请求头中获取
	userID, err := primitive.ObjectIDFromHex(userIDStr)
	if err != nil {
		return &pb.CreateConversationReply{Code: 500, Message: "创建HTTP请求失败"}, nil
	}

	initialContext := []biz.Message{} // 初始上下文为空

	convID, err := s.convUc.Create(ctx, userID, initialContext)
	if err != nil {
		return &pb.CreateConversationReply{Code: 500, Message: "创建会话失败"}, nil
	}

	return &pb.CreateConversationReply{
		Code:           200,
		Message:        "成功",
		ConversationId: convID.Hex(),
	}, nil
}
