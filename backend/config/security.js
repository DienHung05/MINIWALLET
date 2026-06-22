/**
 * CORS — cho phép frontend Vite (http://localhost:5173) gọi API khi dev.
 * (Khi dùng proxy của Vite thì request đi qua server proxy nên không cần CORS,
 *  nhưng bật sẵn để bạn gọi trực tiếp từ trình duyệt/Postman cũng được.)
 */
module.exports.security = {
  cors: {
    allRoutes: true,
    allowOrigins: ['http://localhost:5173'],
    allowCredentials: false,
    allowRequestHeaders: 'content-type,authorization',
  },
};
