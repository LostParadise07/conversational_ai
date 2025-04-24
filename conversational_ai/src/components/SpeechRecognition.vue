<template>
    <div class="speech-recognition-container">
      <div class="controls">
        <select v-model="selectedLang">
          <option value="en-US">English (US)</option>
          <option value="en-GB">English (UK)</option>
          <option value="es-ES">Spanish (ES)</option>
          <option value="fr-FR">French (FR)</option>
          <option value="de-DE">German (DE)</option>
          <option value="hi-IN">Hindi (IN)</option>
          <option value="ur-PK">Urdu (PK)</option>
        </select>
        
        <button 
          @click="startRecognition" 
          :disabled="!isSupported || isListening"
          class="primary-button"
        >
          Start Listening
        </button>
        
        <button 
          @click="stopRecognition" 
          :disabled="!isListening"
          class="secondary-button"
        >
          Stop Listening
        </button>
      </div>
  
      <div class="results">
        <div v-if="result" class="transcript">
          <h3>Current Transcript:</h3>
          <p>{{ result }}</p>
        </div>
        <div class="transcript">
          <h3>Full Transcript:</h3>
          <p v-html="fullTranscript"></p>
        </div>
        
        <div v-if="error" class="error">
          <p>Error: {{ error.message }}</p>
        </div>
        
        <div v-if="!isSupported" class="support-warning">
          <p>⚠️ Speech recognition is not supported in your browser</p>
        </div>
      </div>
    </div>
  </template>
  
  <script>
  import { useSpeechRecognition } from '@vueuse/core'
  import { getChatGPTResponse } from '../chat/chat';
  import { ref, watch } from 'vue'
  
  export default {
    setup() {
      const selectedLang = ref('en-US')
      const fullTranscript = ref('')
      
      const {
        isSupported,
        isListening,
        result,
        error,
        start,
        stop,
        isFinal
      } = useSpeechRecognition({
        lang: selectedLang,
        interimResults: true,
        continuous: true,
        maxAlternatives: 1
      })
  
      watch([result, isFinal], ([newResult, newIsFinal]) => {
        if (newResult && newIsFinal) {
          fullTranscript.value += newResult + ' '
        }
      })
  
      const startRecognition = () => {
        fullTranscript.value = '' 
        start()
      }
  
      const stopRecognition = async () => {
        stop()
        console.log(fullTranscript.value)
        const response = await getChatGPTResponse(fullTranscript.value)
        fullTranscript.value = formatTranscript(response)
        console.log('Updated Full Transcript:', fullTranscript.value)
      }
  
      function formatTranscript(rawText) {
        const paragraphs = rawText
          .split(/\n|\r|\r\n/) 
          .map(line => line.trim())
          .filter(line => line.length > 0);

        return paragraphs
          .map((para, index) => {
            if (/^\d+\.\s/.test(para)) {
              return `<li>${para.replace(/^(\d+\.)/, '<strong>$1</strong>')}</li>`;
            }
            if (/^[A-Z][^:]{3,40}:$/.test(para)) {
              return `<h4>${para}</h4>`;
            }
            return `<p>${para}</p>`;
          })
          .join('');
      }

      return {
        isSupported,
        isListening,
        result,
        error,
        startRecognition,
        stopRecognition,
        selectedLang,
        fullTranscript,
        isFinal
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
  }
  
  .primary-button {
    background-color: #42b983;
    color: white;
    border: none;
    cursor: pointer;
  }
  
  .primary-button:hover {
    background-color: #3a8c6b;
  }
  
  .secondary-button {
    background-color: #f5f5f5;
    cursor: pointer;
  }
  
  .secondary-button:hover {
    background-color: #e0e0e0;
  }
  
  .results {
    padding: 15px;
    background-color: white;
    border-radius: 5px;
  }
  
  .transcript h3 {
    margin-top: 0;
    color: #333;
  }
  
  .error {
    color: #e53935;
    background-color: #ffebee;
    padding: 10px;
    border-radius: 5px;
    margin-top: 10px;
  }
  
  .support-warning {
    color: #ffb300;
    background-color: #fff8e1;
    padding: 10px;
    border-radius: 5px;
    margin-top: 10px;
  }
  </style>