import { Crisp } from 'crisp-sdk-web'
import { defineStore } from 'pinia'
import { onBeforeUnmount, onMounted, ref } from 'vue'

export const useCrispStore = defineStore('crisp', () => {
  const CRISP_WEBSITE_ID = 'b50374f8-3b29-4704-8022-7640e7e73fc3'

  Crisp.configure(CRISP_WEBSITE_ID, {
    autoload: false,
  })

  const isChatOpen = ref(import.meta.client && Crisp.chat.isChatOpened())

  function toggleChat() {
    if (isChatOpen.value) {
      Crisp.chat.close()
    }
    else {
      Crisp.chat.open()
    }
    isChatOpen.value = !isChatOpen.value
  }

  onMounted(() => {
    Crisp.chat.onChatOpened(() => {
      Crisp.chat.show()
      isChatOpen.value = true
    })
    Crisp.chat.onChatClosed(() => {
      Crisp.chat.hide()
      isChatOpen.value = false
    })
  })

  onBeforeUnmount(() => {
    Crisp.chat.offChatOpened()
    Crisp.chat.offChatClosed()
  })

  return {
    Crisp,
    isChatOpen,
    toggleChat,
  }
})
