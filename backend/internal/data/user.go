package data

import (
	"context"

	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/mongo"

	"backend/internal/biz"
)

type userRepo struct {
	data *Data
}

func NewUserRepo(data *Data) biz.UserRepo {
	return &userRepo{data: data}
}

func (r *userRepo) FindByEmail(ctx context.Context, email string) (*biz.User, error) {
	var user biz.User
	err := r.data.Mongo.Database("jujumiao").Collection("users").FindOne(ctx, bson.M{"email": email}).Decode(&user)
	if err == mongo.ErrNoDocuments {
		return nil, nil
	}
	return &user, err
}

func (r *userRepo) Create(ctx context.Context, user *biz.User) error {
	_, err := r.data.Mongo.Database("jujumiao").Collection("users").InsertOne(ctx, user)
	return err
}
