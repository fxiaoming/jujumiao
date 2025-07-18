package server

import (
	v1 "backend/api/aigc/v1"
	"backend/internal/conf"
	"backend/internal/service"
	"github.com/go-kratos/kratos/v2/log"
	"github.com/go-kratos/kratos/v2/middleware/logging"
	"github.com/go-kratos/kratos/v2/middleware/recovery"
	"github.com/go-kratos/kratos/v2/transport/http"
	"github.com/gorilla/handlers"
	"backend/internal/middleware"
	"encoding/json"
	netHttp "net/http"
	"os"
	"path/filepath"
)

// NewHTTPServer new an HTTP server.
func NewHTTPServer(c *conf.Server, chat *service.ChatService, conversation *service.ConversationService, user *service.UserService, logger log.Logger) *http.Server {
	var opts = []http.ServerOption{
		http.Middleware(
			recovery.Recovery(),
			logging.Server(logger),
			middleware.JWTAuth(),
		),
	}
	if c.Http.Network != "" {
		opts = append(opts, http.Network(c.Http.Network))
	}
	if c.Http.Addr != "" {
		opts = append(opts, http.Address(c.Http.Addr))
	}
	if c.Http.Timeout != nil {
		opts = append(opts, http.Timeout(c.Http.Timeout.AsDuration()))
	}
	// 添加CORS中间件
	opts = append(opts, http.Filter(handlers.CORS(
		handlers.AllowedOrigins([]string{"*"}),
		handlers.AllowedMethods([]string{"GET", "POST"}),
		handlers.AllowedHeaders([]string{"Content-Type", "Authorization"}),
	)))
	srv := http.NewServer(opts...)
	v1.RegisterChatHTTPServer(srv, chat)
	v1.RegisterConversationHTTPServer(srv, conversation)
	v1.RegisterUserHTTPServer(srv, user)

	// 单独定义文件上传接口
	srv.Handle("/api/upload", netHttp.HandlerFunc(UploadFileHandler))
	return srv
}

type UploadResponse struct {
	Code int   `json:"code"`
	Message string `json:"message"`
	Data    struct {
			FilePath string `json:"file_path"`
			FileName string `json:"file_name"`
	} `json:"data,omitempty"`
}

func UploadFileHandler(w netHttp.ResponseWriter, r *netHttp.Request) {
	const maxFileSize = 10 << 20 // 10 MB
	uploadDir := "/home/xiaoming/uploadFile/aigcv3"
	// 设置响应头
  w.Header().Set("Content-Type", "application/json")

	// 检查并创建上传目录
	if _, err := os.Stat(uploadDir); os.IsNotExist(err) {
		if err := os.MkdirAll(uploadDir, os.ModePerm); err != nil {
			netHttp.Error(w, "无法创建上传目录", netHttp.StatusInternalServerError)
			return
		}
	}

	// 解析 multipart 表单
	if err := r.ParseMultipartForm(maxFileSize); err != nil {
		netHttp.Error(w, "文件过大或表单解析失败: "+err.Error(), netHttp.StatusBadRequest)
		return
	}

	// 获取文件头
	file, handler, err := r.FormFile("file")
	if err != nil {
		netHttp.Error(w, "未找到文件参数: "+err.Error(), netHttp.StatusBadRequest)
		return
	}
	defer file.Close()

	// 保存文件
	savePath := filepath.Join(uploadDir, handler.Filename)
	outFile, err := os.Create(savePath)
	if err != nil {
		netHttp.Error(w, "创建文件失败: "+err.Error(), netHttp.StatusInternalServerError)
		return
	}
	defer outFile.Close()

	if _, err := outFile.ReadFrom(file); err != nil {
		netHttp.Error(w, "保存文件失败: "+err.Error(), netHttp.StatusInternalServerError)
		return
	}

	response := UploadResponse{
		Code: 200,
		Message: "文件上传成功",
		Data: struct {
			FilePath string `json:"file_path"`
			FileName string `json:"file_name"`
		}{
			FilePath: savePath,
			FileName: handler.Filename,
		},
	}
	json.NewEncoder(w).Encode(response)
}
