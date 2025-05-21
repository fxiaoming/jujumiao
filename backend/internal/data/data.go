package data

import (
	"backend/internal/conf"
	"context"
	"time"

	"github.com/go-kratos/kratos/v2/log"
	"github.com/google/wire"
	"github.com/redis/go-redis/v9"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
)

// ProviderSet is data providers.
var ProviderSet = wire.NewSet(NewData, NewUserRepo)

// Data .
type Data struct {
	// TODO wrapped database client
	Mongo *mongo.Client
	Redis *redis.Client
}

// NewData .
func NewData(c *conf.Data, logger log.Logger, mongo *mongo.Client, redis *redis.Client) (*Data, func(), error) {
	cleanup := func() {
		log.NewHelper(logger).Info("closing the data resources")
	}
	return &Data{Mongo: mongo, Redis: redis}, cleanup, nil
}

func NewMongoClient(conf *conf.Data) (*mongo.Client, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()
	uri := "mongodb://localhost:27017" // 可从配置读取
	client, err := mongo.Connect(ctx, options.Client().ApplyURI(uri))
	if err != nil {
		return nil, err
	}
	return client, nil
}

func NewRedisClient(c *conf.Data) (*redis.Client, error) {
	return redis.NewClient(&redis.Options{
		Addr:     c.Redis.Addr,
		Password: c.Redis.Password,
		DB:       int(c.Redis.Db),
	}), nil
}
