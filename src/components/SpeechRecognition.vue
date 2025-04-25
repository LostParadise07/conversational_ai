<template>
  <div class="speech-recognition-container">
    <div class="controls">
      <select v-model="selectedLang" :disabled="isListening">
        <option value="en-US">English (US)</option>
        <option value="en-GB">English (UK)</option>
        <option value="en-IN">English (IN)</option>
        <option value="hi-IN">Hindi (IN)</option>
        <option value="ur-PK">Urdu (PK)</option>
      </select>

      <button 
        @click="runSpeechRecognition" 
        class="primary-button"
        :class="{ listening: isListening }"
        :disabled="isListening"
      >
        {{ isListening ? 'Listening...' : 'Start Listening' }}
      </button>

      <button 
        @click="stopRecognition" 
        class="secondary-button"
        :disabled="!isListening"
      >
        Stop Listening
      </button>
    </div>

    <div class="results">
      <div class="status-message">
        <div v-if="action" class="warning">{{ action }}</div>
        <div v-if="isLoading" class="loading">Processing response...</div>
      </div>

      <div class="transcript">
        <h3>Current Transcript:</h3>
        <p>{{ interimResult }}</p>
      </div>
      
      <div class="transcript">
        <h3>Full Transcript:</h3>
        <p v-html="formattedTranscript"></p>
      </div>

      <div v-if="error" class="error">
        <p>Error: {{ error }}</p>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, onMounted } from 'vue'
import { getChatGPTResponse } from '../chat/chat'

export default {
  setup() {
    const selectedLang = ref('en-US')
    const formattedTranscript = ref('')
    const interimResult = ref('')
    const error = ref('')
    const recognition = ref(null)
    const action = ref('')
    const isListening = ref(false)
    const isLoading = ref(false)
    const isStopped = ref(false)

    const checkMicrophonePermission = async () => {
      try {
        const permission = await navigator.permissions.query({ name: 'microphone' })
        if (permission.state === 'denied') {
          error.value = 'Microphone access is blocked. Please enable it in site settings.'
        }
      } catch (e) {
        console.error('Permission API not supported', e)
      }
    }

    const runSpeechRecognition = () => {
      formattedTranscript.value = ''
      if (isListening.value) return

      checkMicrophonePermission()
      isListening.value = true
      interimResult.value = ''
      error.value = ''

      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
      if (!SpeechRecognition) {
        error.value = 'Speech recognition not supported in this browser'
        isListening.value = false
        return
      }

      recognition.value = new SpeechRecognition()
      recognition.value.lang = selectedLang.value
      recognition.value.continuous = true
      recognition.value.interimResults = true
      recognition.value.maxAlternatives = 1

      recognition.value.onstart = () => {
        action.value = "Listening, please speak..."
      }

      recognition.value.onresult = (event) => {
        let interim = ''
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          const transcript = event.results[i][0].transcript
          if (event.results[i].isFinal) {
            formattedTranscript.value += transcript + ' '
          } else {
            interim += transcript
          }
        }
        interimResult.value = interim
      }

      recognition.value.onerror = (event) => {
        error.value = `Error: ${event.error}`
        if (event.error === 'not-allowed') {
          error.value += ' - Please allow microphone access'
        }
        isListening.value = false
      }

      recognition.value.onend = () => {
        if (!isStopped.value)
          runSpeechRecognition()
        interimResult.value = ''
      }

      try {
        recognition.value.start()
      } catch (err) {
        error.value = `Error starting recognition: ${err}`
        isListening.value = false
      }
    }

    const stopRecognition = async () => {
      isStopped.value = true
      isListening.value = false
      action.value = ''
      
      if (recognition.value) {
        try {
          recognition.value.stop()
        } catch (err) {
          console.log('Stop error:', err)
        }
      }

      if (formattedTranscript.value.trim()) {
        isLoading.value = true
        try {
          const response = await getChatGPTResponse(formattedTranscript.value)
          formattedTranscript.value = formatTranscript(response)
        } catch (err) {
          error.value = err.message
        } finally {
          isLoading.value = false
        }
      }
    }

    const formatTranscript = (rawText) => {
      return rawText
        .split('\n')
        .map(paragraph => paragraph.trim())
        .filter(paragraph => paragraph.length > 0)
        .map(paragraph => `<p>${paragraph}</p>`)
        .join('')
    }

    onMounted(() => {
      checkMicrophonePermission()
    })

    return {
      selectedLang,
      formattedTranscript,
      interimResult,
      error,
      runSpeechRecognition,
      stopRecognition,
      action,
      isListening,
      isLoading
    }
  }
}
</script>

<style scoped>
.speech-recognition-container {
  background-color: #f5f5f5;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 2px 10px rgba(0,0,0,0.1);
  max-width: 800px;
  margin: 20px auto;
}

.controls {
  display: flex;
  gap: 15px;
  margin-bottom: 20px;
  flex-wrap: wrap;
}

select, button {
  padding: 10px 15px;
  border-radius: 5px;
  border: 1px solid #ddd;
  font-size: 16px;
  min-width: 150px;
}

.primary-button {
  background-color: #42b983;
  color: white;
  border: none;
  cursor: pointer;
  transition: background-color 0.3s;
}

.primary-button:hover {
  background-color: #3a8c6b;
}

.primary-button.listening {
  background-color: #ff4757;
  animation: pulse 1.5s infinite;
}

.secondary-button {
  background-color: #f5f5f5;
  cursor: pointer;
  transition: background-color 0.3s;
}

.secondary-button:hover {
  background-color: #e0e0e0;
}

.results {
  padding: 15px;
  background-color: white;
  border-radius: 5px;
}

.transcript {
  margin: 20px 0;
  padding: 15px;
  background-color: #f8f9fa;
  border-radius: 5px;
}

.transcript h3 {
  margin-top: 0;
  color: #333;
  font-size: 18px;
}

.error {
  color: #e53935;
  background-color: #ffebee;
  padding: 10px;
  border-radius: 5px;
  margin-top: 10px;
}

.warning {
  color: #ffb300;
  background-color: #fff8e1;
  padding: 10px;
  border-radius: 5px;
  margin: 10px 0;
}

.loading {
  color: #2d3436;
  background-color: #dfe6e9;
  padding: 10px;
  border-radius: 5px;
  margin: 10px 0;
}

@keyframes pulse {
  0% { opacity: 1; }
  50% { opacity: 0.5; }
  100% { opacity: 1; }
}

@media (max-width: 600px) {
  .controls {
    flex-direction: column;
  }
  
  select, button {
    width: 100%;
  }
}
</style>