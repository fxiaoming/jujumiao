package data

import (
	"backend/internal/biz"
	"context"
	"encoding/json"

	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"fmt"
)

type Conversation struct {
	ID      primitive.ObjectID `bson:"_id,omitempty"`
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

func (r *ConversationRepo) GetContext(ctx context.Context, convID primitive.ObjectID) ([]biz.Message, error) {
	var conv Conversation
	err := r.data.Mongo.Database("jujumiao").Collection("conversation").FindOne(ctx, bson.M{"_id": convID}).Decode(&conv)
	if err != nil {
		return nil, err
	}
	var contextData []biz.Message
	_ = json.Unmarshal([]byte(conv.Context), &contextData)
	return contextData, nil
}

func (r *ConversationRepo) Create(ctx context.Context, userID primitive.ObjectID, initialContext []biz.Message) (primitive.ObjectID, error) {
	contextJSON, err := json.Marshal(initialContext)
	if err != nil {
		return primitive.NilObjectID, err
	}
	conv := Conversation{
		ID:      primitive.NewObjectID(),
		UserID:  userID,
		Context: string(contextJSON),
	}
	fmt.Println("conv", conv)
	res, err := r.data.Mongo.Database("jujumiao").Collection("conversation").InsertOne(ctx, conv)
	if err != nil {
		return primitive.NilObjectID, err
	}
	return res.InsertedID.(primitive.ObjectID), nil
}

func (r *ConversationRepo) GetConversation(ctx context.Context, convID primitive.ObjectID) ([]biz.Message, error) {
	var conv Conversation
	err := r.data.Mongo.Database("jujumiao").Collection("conversation").FindOne(ctx, bson.M{"_id": convID}).Decode(&conv)
	if err != nil {
		return nil, err
	}
	var contextData []biz.Message
	_ = json.Unmarshal([]byte(conv.Context), &contextData)
	return contextData, nil
}

func (r *ConversationRepo) ListByUserID(ctx context.Context, userID primitive.ObjectID) ([]primitive.ObjectID, error) {
	var convs []Conversation
	cursor, err := r.data.Mongo.Database("jujumiao").Collection("conversation").Find(ctx, bson.M{"user_id": userID})
	if err != nil {
		return nil, err
	}
	defer cursor.Close(ctx)

	for cursor.Next(ctx) {
		var conv Conversation
		if err := cursor.Decode(&conv); err != nil {
			return nil, err
		}
		convs = append(convs, conv)
	}

	convIDs := make([]primitive.ObjectID, len(convs))
	for i, conv := range convs {
		convIDs[i] = conv.ID
	}
	return convIDs, nil
}

func (r *ConversationRepo) UpdateContext(ctx context.Context, convID primitive.ObjectID, messages []biz.Message) error {
	contextJSON, err := json.Marshal(messages)
	if err != nil {
			return err
	}

	_, err = r.data.Mongo.Database("jujumiao").Collection("conversation").UpdateOne(ctx, bson.M{"_id": convID}, bson.M{"$set": bson.M{"context": string(contextJSON)}})
	return err
}
