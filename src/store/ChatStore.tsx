import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

interface ChatId {
    chatId: string | null,
    setChatId: (chatId: string | null) => void;
    reset: () => void;
}

const initialStateChatId = {
    chatId: "nil",
};

export const useChatIdStore = create<
  ChatId,
  [["zustand/persist", ChatId]]
>(
  persist(
    (set) => ({
        ...initialStateChatId,
        setChatId: (id) =>  set({chatId: id as string}),
        reset: () => set(initialStateChatId),
    }),
    {
      name: "chat_id",
      storage: createJSONStorage(() => localStorage),
    }
  )
);
