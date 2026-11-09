// One-off: add support-inbox i18n keys to every locale file.
// Run: node scripts/i18n-add-support.mjs
import { readFileSync, writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const LOCALES = ["en", "pt-PT", "es", "sv", "nl", "zh-Hans", "ar", "zu", "fr", "pl", "ru", "nb", "cs", "it"];

// "Support" nav label per locale.
const NAV_SUPPORT = {
  en: "Support", "pt-PT": "Suporte", es: "Soporte", sv: "Support", nl: "Support",
  "zh-Hans": "支持", ar: "الدعم", zu: "Usizo", fr: "Assistance", pl: "Wsparcie",
  ru: "Поддержка", nb: "Brukerstøtte", cs: "Podpora", it: "Assistenza",
};

// Pages.support — the user-facing /support form.
const PAGES_SUPPORT = {
  en: {
    title: "Support", subtitle: "Send us a message — we reply by email.",
    fName: "Your name", fEmail: "Your email", fSubject: "Subject",
    subjects: {
      account: "Account", payment: "Payment & billing", bank: "Bank connection",
      bug: "Bug report", feature: "Feature request", other: "Something else",
    },
    fMessage: "Message", fMessagePh: "Describe your question or issue…",
    sending: "Sending…", send: "Send message",
    replyNote: "We reply to the email address above — usually within one business day.",
    sentTitle: "Message sent", sentBody: "Thanks — we have received your message and will reply by email shortly.",
    backHome: "Back to dashboard",
    toastSent: "Message sent — we will reply by email.", toastError: "Could not send — please try again.",
  },
  "pt-PT": {
    title: "Suporte", subtitle: "Envie-nos uma mensagem — respondemos por e-mail.",
    fName: "O seu nome", fEmail: "O seu e-mail", fSubject: "Assunto",
    subjects: {
      account: "Conta", payment: "Pagamento e faturação", bank: "Ligação bancária",
      bug: "Reporte de erro", feature: "Pedido de funcionalidade", other: "Outra questão",
    },
    fMessage: "Mensagem", fMessagePh: "Descreva a sua questão ou problema…",
    sending: "A enviar…", send: "Enviar mensagem",
    replyNote: "Respondemos para o e-mail indicado acima — normalmente num dia útil.",
    sentTitle: "Mensagem enviada", sentBody: "Obrigado — recebemos a sua mensagem e responderemos em breve por e-mail.",
    backHome: "Voltar ao painel",
    toastSent: "Mensagem enviada — responderemos por e-mail.", toastError: "Não foi possível enviar — tente novamente.",
  },
  es: {
    title: "Soporte", subtitle: "Envíanos un mensaje — respondemos por correo electrónico.",
    fName: "Tu nombre", fEmail: "Tu correo", fSubject: "Asunto",
    subjects: {
      account: "Cuenta", payment: "Pago y facturación", bank: "Conexión bancaria",
      bug: "Informe de error", feature: "Solicitud de función", other: "Otra cosa",
    },
    fMessage: "Mensaje", fMessagePh: "Describe tu pregunta o problema…",
    sending: "Enviando…", send: "Enviar mensaje",
    replyNote: "Respondemos al correo indicado arriba — normalmente en un día laborable.",
    sentTitle: "Mensaje enviado", sentBody: "Gracias — hemos recibido tu mensaje y te responderemos pronto por correo.",
    backHome: "Volver al panel",
    toastSent: "Mensaje enviado — te responderemos por correo.", toastError: "No se pudo enviar — inténtalo de nuevo.",
  },
  sv: {
    title: "Support", subtitle: "Skicka ett meddelande — vi svarar via e-post.",
    fName: "Ditt namn", fEmail: "Din e-post", fSubject: "Ämne",
    subjects: {
      account: "Konto", payment: "Betalning och fakturering", bank: "Bankanslutning",
      bug: "Felrapport", feature: "Funktionsförfrågan", other: "Något annat",
    },
    fMessage: "Meddelande", fMessagePh: "Beskriv din fråga eller ditt problem…",
    sending: "Skickar…", send: "Skicka meddelande",
    replyNote: "Vi svarar till e-postadressen ovan — vanligtvis inom en arbetsdag.",
    sentTitle: "Meddelande skickat", sentBody: "Tack — vi har tagit emot ditt meddelande och svarar snart via e-post.",
    backHome: "Tillbaka till översikten",
    toastSent: "Meddelande skickat — vi svarar via e-post.", toastError: "Kunde inte skicka — försök igen.",
  },
  nl: {
    title: "Support", subtitle: "Stuur ons een bericht — we antwoorden per e-mail.",
    fName: "Je naam", fEmail: "Je e-mailadres", fSubject: "Onderwerp",
    subjects: {
      account: "Account", payment: "Betaling en facturatie", bank: "Bankkoppeling",
      bug: "Bugrapport", feature: "Functieverzoek", other: "Iets anders",
    },
    fMessage: "Bericht", fMessagePh: "Beschrijf je vraag of probleem…",
    sending: "Verzenden…", send: "Bericht versturen",
    replyNote: "We antwoorden op het e-mailadres hierboven — meestal binnen één werkdag.",
    sentTitle: "Bericht verzonden", sentBody: "Bedankt — we hebben je bericht ontvangen en antwoorden binnenkort per e-mail.",
    backHome: "Terug naar dashboard",
    toastSent: "Bericht verzonden — we antwoorden per e-mail.", toastError: "Verzenden mislukt — probeer het opnieuw.",
  },
  "zh-Hans": {
    title: "支持", subtitle: "给我们发消息——我们会通过电子邮件回复。",
    fName: "您的姓名", fEmail: "您的邮箱", fSubject: "主题",
    subjects: {
      account: "账户", payment: "付款与账单", bank: "银行连接",
      bug: "错误报告", feature: "功能请求", other: "其他问题",
    },
    fMessage: "留言", fMessagePh: "请描述您的问题或疑问……",
    sending: "发送中……", send: "发送消息",
    replyNote: "我们会回复到上方填写的邮箱——通常在一个工作日内。",
    sentTitle: "消息已发送", sentBody: "谢谢——我们已收到您的消息，将尽快通过电子邮件回复您。",
    backHome: "返回仪表板",
    toastSent: "消息已发送——我们会通过电子邮件回复。", toastError: "发送失败——请重试。",
  },
  ar: {
    title: "الدعم", subtitle: "أرسل لنا رسالة — نرد عبر البريد الإلكتروني.",
    fName: "اسمك", fEmail: "بريدك الإلكتروني", fSubject: "الموضوع",
    subjects: {
      account: "الحساب", payment: "الدفع والفوترة", bank: "ربط البنك",
      bug: "الإبلاغ عن خطأ", feature: "طلب ميزة", other: "أمر آخر",
    },
    fMessage: "الرسالة", fMessagePh: "صف سؤالك أو مشكلتك…",
    sending: "جارٍ الإرسال…", send: "إرسال الرسالة",
    replyNote: "نرد على عنوان البريد الإلكتروني أعلاه — عادة خلال يوم عمل واحد.",
    sentTitle: "تم إرسال الرسالة", sentBody: "شكرًا — استلمنا رسالتك وسنرد قريبًا عبر البريد الإلكتروني.",
    backHome: "العودة إلى لوحة التحكم",
    toastSent: "تم إرسال الرسالة — سنرد عبر البريد الإلكتروني.", toastError: "تعذر الإرسال — حاول مرة أخرى.",
  },
  zu: {
    title: "Usizo", subtitle: "Sithumele umyalezo — siyaphendula nge-imeyili.",
    fName: "Igama lakho", fEmail: "I-imeyili yakho", fSubject: "Isihloko",
    subjects: {
      account: "I-akhawunti", payment: "Inkokhelo nokukhokha", bank: "Uxhunyeko lwensimba",
      bug: "Ukubika iphutha", feature: "Isicelo sesici", other: "Okunye",
    },
    fMessage: "Umyalezo", fMessagePh: "Chaza umbuzo noma inkinga yakho…",
    sending: "Ithumela…", send: "Thumela umyalezo",
    replyNote: "Siphendula kwi-imeyili engezansi — imvamisa kungakapheli usuku olulodwa lomsebenzi.",
    sentTitle: "Umyalezo uthunyelwe", sentBody: "Siyabonga — siye wavuma umyalezo wakho futhi sizopendula maduzane nge-imeyili.",
    backHome: "Buyela kwidashibhodi",
    toastSent: "Umyalezo uthunyelwe — sizopendula nge-imeyili.", toastError: "Ayikwazanga ukuthumela — sicela uzame futhi.",
  },
  fr: {
    title: "Assistance", subtitle: "Envoyez-nous un message — nous répondons par e-mail.",
    fName: "Votre nom", fEmail: "Votre e-mail", fSubject: "Objet",
    subjects: {
      account: "Compte", payment: "Paiement et facturation", bank: "Connexion bancaire",
      bug: "Signalement de bug", feature: "Demande de fonctionnalité", other: "Autre chose",
    },
    fMessage: "Message", fMessagePh: "Décrivez votre question ou votre problème…",
    sending: "Envoi…", send: "Envoyer le message",
    replyNote: "Nous répondons à l''adresse e-mail ci-dessus — généralement sous un jour ouvré.",
    sentTitle: "Message envoyé", sentBody: "Merci — nous avons bien reçu votre message et vous répondrons bientôt par e-mail.",
    backHome: "Retour au tableau de bord",
    toastSent: "Message envoyé — nous répondrons par e-mail.", toastError: "Envoi impossible — veuillez réessayer.",
  },
  pl: {
    title: "Wsparcie", subtitle: "Wyślij nam wiadomość — odpowiadamy e-mailem.",
    fName: "Twoje imię", fEmail: "Twój e-mail", fSubject: "Temat",
    subjects: {
      account: "Konto", payment: "Płatność i fakturowanie", bank: "Połączenie bankowe",
      bug: "Zgłoszenie błędu", feature: "Prośba o funkcję", other: "Coś innego",
    },
    fMessage: "Wiadomość", fMessagePh: "Opisz swoje pytanie lub problem…",
    sending: "Wysyłanie…", send: "Wyślij wiadomość",
    replyNote: "Odpowiadamy na podany powyżej adres e-mail — zazwyczaj w ciągu jednego dnia roboczego.",
    sentTitle: "Wiadomość wysłana", sentBody: "Dziękujemy — otrzymaliśmy Twoją wiadomość i wkrótce odpowiemy e-mailem.",
    backHome: "Wróć do panelu",
    toastSent: "Wiadomość wysłana — odpowiemy e-mailem.", toastError: "Nie udało się wysłać — spróbuj ponownie.",
  },
  ru: {
    title: "Поддержка", subtitle: "Отправьте нам сообщение — мы отвечаем по электронной почте.",
    fName: "Ваше имя", fEmail: "Ваш e-mail", fSubject: "Тема",
    subjects: {
      account: "Аккаунт", payment: "Оплата и выставление счетов", bank: "Банковское подключение",
      bug: "Сообщение об ошибке", feature: "Запрос функции", other: "Другое",
    },
    fMessage: "Сообщение", fMessagePh: "Опишите ваш вопрос или проблему…",
    sending: "Отправка…", send: "Отправить сообщение",
    replyNote: "Мы отвечаем на указанный выше e-mail — обычно в течение одного рабочего дня.",
    sentTitle: "Сообщение отправлено", sentBody: "Спасибо — мы получили ваше сообщение и скоро ответим по электронной почте.",
    backHome: "Назад к панели",
    toastSent: "Сообщение отправлено — мы ответим по e-mail.", toastError: "Не удалось отправить — попробуйте ещё раз.",
  },
  nb: {
    title: "Brukerstøtte", subtitle: "Send oss en melding — vi svarer på e-post.",
    fName: "Navnet ditt", fEmail: "E-posten din", fSubject: "Emne",
    subjects: {
      account: "Konto", payment: "Betaling og fakturering", bank: "Bankkobling",
      bug: "Feilrapport", feature: "Funksjonsforespørsel", other: "Noe annet",
    },
    fMessage: "Melding", fMessagePh: "Beskriv spørsmålet eller problemet ditt…",
    sending: "Sender…", send: "Send melding",
    replyNote: "Vi svarer til e-postadressen ovenfor — vanligvis innen én virkedag.",
    sentTitle: "Melding sendt", sentBody: "Takk — vi har mottatt meldingen din og svarer snart på e-post.",
    backHome: "Tilbake til dashbordet",
    toastSent: "Melding sendt — vi svarer på e-post.", toastError: "Kunne ikke sende — prøv igjen.",
  },
  cs: {
    title: "Podpora", subtitle: "Napište nám zprávu — odpovídáme e-mailem.",
    fName: "Vaše jméno", fEmail: "Váš e-mail", fSubject: "Předmět",
    subjects: {
      account: "Účet", payment: "Platba a fakturace", bank: "Bankovní propojení",
      bug: "Nahlášení chyby", feature: "Žádost o funkci", other: "Něco jiného",
    },
    fMessage: "Zpráva", fMessagePh: "Popište svůj dotaz nebo problém…",
    sending: "Odesílání…", send: "Odeslat zprávu",
    replyNote: "Odpovídáme na e-mail uvedený výše — obvykle do jednoho pracovního dne.",
    sentTitle: "Zpráva odeslána", sentBody: "Děkujeme — vaši zprávu jsme obdrželi a brzy odpovíme e-mailem.",
    backHome: "Zpět na přehled",
    toastSent: "Zpráva odeslána — odpovíme e-mailem.", toastError: "Odeslání se nezdařilo — zkuste to znovu.",
  },
  it: {
    title: "Assistenza", subtitle: "Inviaci un messaggio — rispondiamo via e-mail.",
    fName: "Il tuo nome", fEmail: "La tua e-mail", fSubject: "Oggetto",
    subjects: {
      account: "Account", payment: "Pagamento e fatturazione", bank: "Connessione bancaria",
      bug: "Segnalazione bug", feature: "Richiesta di funzionalità", other: "Altro",
    },
    fMessage: "Messaggio", fMessagePh: "Descrivi la tua domanda o il tuo problema…",
    sending: "Invio…", send: "Invia messaggio",
    replyNote: "Rispondiamo all''indirizzo e-mail indicato sopra — di solito entro un giorno lavorativo.",
    sentTitle: "Messaggio inviato", sentBody: "Grazie — abbiamo ricevuto il tuo messaggio e ti risponderemo presto via e-mail.",
    backHome: "Torna alla dashboard",
    toastSent: "Messaggio inviato — ti risponderemo via e-mail.", toastError: "Invio non riuscito — riprova.",
  },
};

// Pages.adm_support — new keys for the real inbox UI.
const ADM_SUPPORT = {
  en: {
    emptyState: "No support messages yet.", filterAll: "All statuses", refresh: "Refresh",
    detailFrom: "From", detailReceived: "Received", replyByEmail: "Reply by email", update: "Update",
    statusOpen: "Open", statusInProgress: "In progress", statusResolved: "Resolved", statusClosed: "Closed",
    toastSaved: "Status updated.", toastError: "Update failed — try again.",
  },
  "pt-PT": {
    emptyState: "Ainda não há mensagens de suporte.", filterAll: "Todos os estados", refresh: "Atualizar",
    detailFrom: "De", detailReceived: "Recebida em", replyByEmail: "Responder por e-mail", update: "Atualizar",
    statusOpen: "Aberta", statusInProgress: "Em curso", statusResolved: "Resolvida", statusClosed: "Fechada",
    toastSaved: "Estado atualizado.", toastError: "Falha ao atualizar — tente novamente.",
  },
  es: {
    emptyState: "Aún no hay mensajes de soporte.", filterAll: "Todos los estados", refresh: "Actualizar",
    detailFrom: "De", detailReceived: "Recibido", replyByEmail: "Responder por correo", update: "Actualizar",
    statusOpen: "Abierto", statusInProgress: "En curso", statusResolved: "Resuelto", statusClosed: "Cerrado",
    toastSaved: "Estado actualizado.", toastError: "Error al actualizar — inténtalo de nuevo.",
  },
  sv: {
    emptyState: "Inga supportmeddelanden ännu.", filterAll: "Alla statusar", refresh: "Uppdatera",
    detailFrom: "Från", detailReceived: "Mottaget", replyByEmail: "Svara via e-post", update: "Uppdatera",
    statusOpen: "Öppen", statusInProgress: "Pågår", statusResolved: "Löst", statusClosed: "Stängd",
    toastSaved: "Status uppdaterad.", toastError: "Kunde inte uppdatera — försök igen.",
  },
  nl: {
    emptyState: "Nog geen supportberichten.", filterAll: "Alle statussen", refresh: "Vernieuwen",
    detailFrom: "Van", detailReceived: "Ontvangen", replyByEmail: "Beantwoord per e-mail", update: "Bijwerken",
    statusOpen: "Open", statusInProgress: "In behandeling", statusResolved: "Opgelost", statusClosed: "Gesloten",
    toastSaved: "Status bijgewerkt.", toastError: "Bijwerken mislukt — probeer opnieuw.",
  },
  "zh-Hans": {
    emptyState: "暂无支持消息。", filterAll: "所有状态", refresh: "刷新",
    detailFrom: "发件人", detailReceived: "接收时间", replyByEmail: "通过邮件回复", update: "更新",
    statusOpen: "待处理", statusInProgress: "处理中", statusResolved: "已解决", statusClosed: "已关闭",
    toastSaved: "状态已更新。", toastError: "更新失败——请重试。",
  },
  ar: {
    emptyState: "لا توجد رسائل دعم بعد.", filterAll: "كل الحالات", refresh: "تحديث",
    detailFrom: "من", detailReceived: "تم الاستلام", replyByEmail: "الرد عبر البريد", update: "تحديث",
    statusOpen: "مفتوحة", statusInProgress: "قيد المعالجة", statusResolved: "تم الحل", statusClosed: "مغلقة",
    toastSaved: "تم تحديث الحالة.", toastError: "فشل التحديث — حاول مرة أخرى.",
  },
  zu: {
    emptyState: "Alukho umyalezo wesizo okwamanje.", filterAll: "Konke izimo", refresh: "Vuselela",
    detailFrom: "Kumuntu", detailReceived: "Kuthunyelwe", replyByEmail: "Phendula nge-imeyili", update: "Buyekeza",
    statusOpen: "Evuliwe", statusInProgress: "Iyaqhubeka", statusResolved: "Ixazululiwe", statusClosed: "Ivaliwe",
    toastSaved: "Isimo sibuyekeziwe.", toastError: "Ukubuyekeza kwehlulekile — sicela uzame futhi.",
  },
  fr: {
    emptyState: "Aucun message de support pour le moment.", filterAll: "Tous les statuts", refresh: "Actualiser",
    detailFrom: "De", detailReceived: "Reçu le", replyByEmail: "Répondre par e-mail", update: "Mettre à jour",
    statusOpen: "Ouvert", statusInProgress: "En cours", statusResolved: "Résolu", statusClosed: "Fermé",
    toastSaved: "Statut mis à jour.", toastError: "Échec de la mise à jour — réessayez.",
  },
  pl: {
    emptyState: "Brak wiadomości wsparcia.", filterAll: "Wszystkie statusy", refresh: "Odśwież",
    detailFrom: "Od", detailReceived: "Otrzymano", replyByEmail: "Odpowiedz e-mailem", update: "Aktualizuj",
    statusOpen: "Otwarty", statusInProgress: "W trakcie", statusResolved: "Rozwiązany", statusClosed: "Zamknięty",
    toastSaved: "Status zaktualizowany.", toastError: "Aktualizacja nie powiodła się — spróbuj ponownie.",
  },
  ru: {
    emptyState: "Сообщений поддержки пока нет.", filterAll: "Все статусы", refresh: "Обновить",
    detailFrom: "От", detailReceived: "Получено", replyByEmail: "Ответить по e-mail", update: "Обновить",
    statusOpen: "Открыто", statusInProgress: "В работе", statusResolved: "Решено", statusClosed: "Закрыто",
    toastSaved: "Статус обновлён.", toastError: "Не удалось обновить — попробуйте ещё раз.",
  },
  nb: {
    emptyState: "Ingen brukerstøttemeldinger ennå.", filterAll: "Alle statuser", refresh: "Oppdater",
    detailFrom: "Fra", detailReceived: "Mottatt", replyByEmail: "Svar på e-post", update: "Oppdater",
    statusOpen: "Åpen", statusInProgress: "Under arbeid", statusResolved: "Løst", statusClosed: "Lukket",
    toastSaved: "Status oppdatert.", toastError: "Oppdatering mislyktes — prøv igjen.",
  },
  cs: {
    emptyState: "Zatím žádné zprávy podpory.", filterAll: "Všechny stavy", refresh: "Obnovit",
    detailFrom: "Od", detailReceived: "Přijato", replyByEmail: "Odpovědět e-mailem", update: "Aktualizovat",
    statusOpen: "Otevřeno", statusInProgress: "Probíhá", statusResolved: "Vyřešeno", statusClosed: "Uzavřeno",
    toastSaved: "Stav aktualizován.", toastError: "Aktualizace se nezdařila — zkuste to znovu.",
  },
  it: {
    emptyState: "Nessun messaggio di supporto per ora.", filterAll: "Tutti gli stati", refresh: "Aggiorna",
    detailFrom: "Da", detailReceived: "Ricevuto", replyByEmail: "Rispondi via e-mail", update: "Aggiorna",
    statusOpen: "Aperto", statusInProgress: "In corso", statusResolved: "Risolto", statusClosed: "Chiuso",
    toastSaved: "Stato aggiornato.", toastError: "Aggiornamento non riuscito — riprova.",
  },
};

for (const loc of LOCALES) {
  const file = join(root, "messages", `${loc}.json`);
  const data = JSON.parse(readFileSync(file, "utf8"));

  // Nav.<role>.support for every role namespace.
  data.Nav = data.Nav || {};
  for (const role of ["user", "admin", "corporate", "employee"]) {
    data.Nav[role] = data.Nav[role] || {};
    data.Nav[role].support = NAV_SUPPORT[loc];
  }

  data.Pages = data.Pages || {};
  data.Pages.support = { ...(data.Pages.support || {}), ...PAGES_SUPPORT[loc] };
  data.Pages.adm_support = { ...(data.Pages.adm_support || {}), ...ADM_SUPPORT[loc] };

  writeFileSync(file, JSON.stringify(data, null, 2) + "\n");
  console.log(`updated ${loc}.json`);
}
