import { createApp } from 'vue'
import App from './App.vue'
import SpeechRecognition from './components/SpeechRecognition.vue';

createApp(App)
  .component('SpeechRecognition', SpeechRecognition)
  .mount('#app')