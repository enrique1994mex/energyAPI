const errorMiddleware = (err, req, res, next) => {
  console.error("ERROR:", err);

  res.status(500).json({
    message: "Internal Server Error",
  });
};

export default errorMiddleware;