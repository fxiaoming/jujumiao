package data

import (
	"backend/internal/biz"
	"context"
	"encoding/json"

	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

type Conversation struct {
	ID      primitive.ObjectID `bson:"_id"`
	UserID  primitive.ObjectID `bson:"user_id"`
	Context string             `bson:"context"`
	// 其它字段可补充
}

type Message struct {
	Role    string `json:"role"`
	Content string `json:"content"`
}

type ConversationRepo struct {
	data *Data
}

func NewConversationRepo(data *Data) biz.ConversationRepo {
	return &ConversationRepo{data: data}
}

func (r *ConversationRepo) GetContext(ctx context.Context, convID primitive.ObjectID) ([]Message, error) {
	var conv Conversation
	err := r.data.Mongo.Database("jujumiao").Collection("conversation").FindOne(ctx, bson.M{"_id": convID}).Decode(&conv)
	if err != nil {
		return nil, err
	}
	var contextData []Message
	_ = json.Unmarshal([]byte(conv.Context), &contextData)
	return contextData, nil
}

func (r *ConversationRepo) Create(ctx context.Context, userID primitive.ObjectID, initialContext []Message) (primitive.ObjectID, error) {
	contextJSON, err := json.Marshal(initialContext)
	if err != nil {
		return primitive.NilObjectID, err
	}
	conv := Conversation{
		UserID:  userID,
		Context: string(contextJSON),
	}
	res, err := r.data.Mongo.Database("jujumiao").Collection("conversation").InsertOne(ctx, conv)
	if err != nil {
		return primitive.NilObjectID, err
	}
	return res.InsertedID.(primitive.ObjectID), nil
}
