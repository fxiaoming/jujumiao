package biz

import (
	"context"

	"github.com/google/wire"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

// UserRepo 用户仓库接口
// 你可以根据实际需要扩展方法
//
//	type UserRepo interface {
//		FindByEmail(ctx context.Context, email string) (*User, error)
//	}
//
//go:generate mockgen -destination=../mock/biz_mock.go -package=mock . UserRepo
type User struct {
	ID       primitive.ObjectID `bson:"_id,omitempty"`
	Email    string             `bson:"email"`
	Password string             `bson:"password"`
}

type UserRepo interface {
	FindByEmail(ctx context.Context, email string) (*User, error)
	Create(ctx context.Context, user *User) error
}

type UserUsecase struct {
	Repo UserRepo
}

func NewUserUsecase(repo UserRepo) *UserUsecase {
	return &UserUsecase{Repo: repo}
}

// Message 聊天消息结构体
// 可根据实际需要扩展字段
//
//	type Message struct {
//		Role    string `json:"role"`
//		Content string `json:"content"`
//	}
type Message struct {
	Role    string
	Content string
}

type ConversationUsecase struct{}

func NewConversationUsecase() *ConversationUsecase {
	return &ConversationUsecase{}
}

func (uc *ConversationUsecase) Create(ctx context.Context, userID primitive.ObjectID, initialContext []Message) (primitive.ObjectID, error) {
	// 这里应调用data层实际实现，暂返回空ID
	return primitive.NewObjectID(), nil
}

func (uc *ConversationUsecase) GetContext(ctx context.Context, convID primitive.ObjectID) ([]Message, error) {
	// 这里应调用data层实际实现，暂返回空slice
	return []Message{}, nil
}

// ProviderSet is biz providers.
var ProviderSet = wire.NewSet(NewUserUsecase, NewConversationUsecase)
