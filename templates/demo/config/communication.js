module.exports = {
  default: {
    enabled: true,
    provider: "whisper",
    available_providers: ["whisper"],
    connection: {
      host: "localhost",
      port: 8546,
      type: "ws"
    }
  }
}
