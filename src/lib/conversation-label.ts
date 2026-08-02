export function labelConversation(messages: string, state: string | null): string {
  if (state) {
    try {
      const parsed = JSON.parse(state)
      if (parsed.cliente) return parsed.cliente
    } catch {}
  }
  try {
    const msgs = JSON.parse(messages) as { role: string; content: string; displayContent?: string }[]
    const firstUser = msgs.find(m => m.role === "user")
    if (firstUser) {
      const text = (firstUser.displayContent ?? firstUser.content).replace(/\n/g, " ")
      return text.length > 60 ? text.slice(0, 60) + "…" : text
    }
  } catch {}
  return "Conversación sin nombre"
}
