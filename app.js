const micButton = document.getElementById('micButton')
const dateInput = document.getElementById('dateInput')
const recognizedText = document.getElementById('recognizedText')

const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition

if (!SpeechRecognition) {
  alert('Tarayıcınız konuşma tanımayı desteklemiyor.')
} else {
  const recognition = new SpeechRecognition()
  recognition.lang = 'tr-TR'
  recognition.continuous = false
  recognition.interimResults = false

  micButton.onclick = () => {
    recognition.start()
    micButton.innerText = 'Dinleniyor...'
  }

  recognition.onresult = (event) => {
    const transcript = event.results[0][0].transcript

    const parsedDate = parseTurkishDate(transcript)
    if (parsedDate) {
      // Yerel saat dilimini kullanarak yyyy-mm-dd formatı üret
      const yyyy = parsedDate.getFullYear()
      const mm = String(parsedDate.getMonth() + 1).padStart(2, '0')
      const dd = String(parsedDate.getDate()).padStart(2, '0')
      dateInput.value = `${yyyy}-${mm}-${dd}`
    } else {
      recognizedText.textContent = '(tarih algılanamadı)'
    }

    micButton.innerText = 'Tıkla Konuş'
  }

  recognition.onerror = (event) => {
    console.error('Hata:', event.error)
    micButton.innerText = 'Tıkla Konuş'
  }
}

function parseTurkishDate(text) {
  const now = new Date()
  const result = new Date(now)
  result.setHours(12) // UTC hatalarını azaltır
  text = text.toLowerCase()

  const gunler = ['pazar', 'pazartesi', 'salı', 'çarşamba', 'perşembe', 'cuma', 'cumartesi']
  const aylar = {
    ocak: 0,
    şubat: 1,
    mart: 2,
    nisan: 3,
    mayıs: 4,
    haziran: 5,
    temmuz: 6,
    ağustos: 7,
    eylül: 8,
    ekim: 9,
    kasım: 10,
    aralık: 11,
  }

  // 1. Bugün, yarın, dün
  if (text.includes('bugün')) return result
  if (text.includes('yarın')) {
    result.setDate(result.getDate() + 1)
    return result
  }
  if (text.includes('dün')) {
    result.setDate(result.getDate() - 1)
    return result
  }

  // 2. "2 yıl önce bugün", "3 hafta sonra" gibi yapılar
  const relatifRegex = /(\d+)\s+(gün|hafta|ay|yıl)\s+(önce|sonra)/
  const relatifMatch = text.match(relatifRegex)
  if (relatifMatch) {
    const miktar = parseInt(relatifMatch[1])
    const birim = relatifMatch[2]
    const yon = relatifMatch[3] === 'önce' ? -1 : 1

    switch (birim) {
      case 'gün':
        result.setDate(result.getDate() + yon * miktar)
        break
      case 'hafta':
        result.setDate(result.getDate() + yon * miktar * 7)
        break
      case 'ay':
        result.setMonth(result.getMonth() + yon * miktar)
        break
      case 'yıl':
        result.setFullYear(result.getFullYear() + yon * miktar)
        break
    }

    return result
  }

  // 3. Hafta ve gün adı (geçen hafta salı, önümüzdeki hafta perşembe)
  const haftaGunRegex =
    /(geçen hafta|önümüzdeki hafta|bu hafta)?\s*(pazar|pazartesi|salı|çarşamba|perşembe|cuma|cumartesi)/
  const haftaGunMatch = text.match(haftaGunRegex)
  if (haftaGunMatch) {
    const baglam = haftaGunMatch[1] || 'bu hafta'
    const hedefGun = gunler.indexOf(haftaGunMatch[2])
    const bugunGun = now.getDay()
    let fark = hedefGun - bugunGun

    if (baglam === 'geçen hafta') fark -= 7
    else if (baglam === 'önümüzdeki hafta') fark += 7

    result.setDate(result.getDate() + fark)
    return result
  }

  // 4. Sadece hafta/ay/yıl bağlamı (geçen yıl, önümüzdeki ay vs.)
  if (text.includes('geçen yıl')) {
    result.setFullYear(result.getFullYear() - 1)
    return result
  }
  if (text.includes('önümüzdeki yıl')) {
    result.setFullYear(result.getFullYear() + 1)
    return result
  }
  if (text.includes('geçen ay')) {
    result.setMonth(result.getMonth() - 1)
    return result
  }
  if (text.includes('önümüzdeki ay')) {
    result.setMonth(result.getMonth() + 1)
    return result
  }
  if (text.includes('geçen hafta')) {
    result.setDate(result.getDate() - 7)
    return result
  }
  if (text.includes('önümüzdeki hafta')) {
    result.setDate(result.getDate() + 7)
    return result
  }

  // 5. Ay-gün(-yıl) formatı
  const tarihRegex =
    /(\d{1,2})\s+(ocak|şubat|mart|nisan|mayıs|haziran|temmuz|ağustos|eylül|ekim|kasım|aralık)(?:\s+(\d{4}))?/
  const match = text.match(tarihRegex)
  if (match) {
    const gun = parseInt(match[1])
    const ay = aylar[match[2]]
    const yil = match[3] ? parseInt(match[3]) : now.getFullYear()
    return new Date(yil, ay, gun)
  }

  return null // eşleşen bir şey yoksa
}

function formatDateHuman(date) {
  return new Intl.DateTimeFormat('tr-TR', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(date)
}
