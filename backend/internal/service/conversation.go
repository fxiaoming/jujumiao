package service

import (
	"context"
	"fmt"

	pb "backend/api/aigc/v1"
	"backend/internal/biz"
	"backend/internal/middleware"
	// "go.mongodb.org/mongo-driver/bson/primitive"
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
	email, _ := ctx.Value(middleware.CtxKeyEmail{}).(string)
	fmt.Println("当前用户email:", email)

	// 假设你已经从 email 获取了 userID
	userID, err := s.convUc.GetUserIDByEmail(ctx, email)
	if err != nil {
		return &pb.CreateConversationReply{Code: 500, Message: "获取用户ID失败"}, nil
	}

	initialContext := []biz.Message{} // 初始上下文为空

	convID, err := s.convUc.Create(ctx, userID, initialContext)
	if err != nil {
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
