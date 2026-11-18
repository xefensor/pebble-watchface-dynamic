'use strict';

// Each row follows the English order. The three groups cover the picker,
// finding and importing fonts, and verified delivery to the watch.
var labels = {
  en: [
    'Built-in fonts','Saved fonts','Back to fonts','More results','No matching fonts','Dynamic Default','Font saved on watch',
    'Browse Google Fonts','Search Google Fonts','Font family','Style','Add font','Loading Google Fonts…','Could not load Google Fonts','Could not add Google Font','Could not import font',
    'Reimport this font on the phone','Not enough space for the new fonts','Could not send fonts to the watch',
  ],
  cs: [
    'Vestavěná písma','Uložená písma','Zpět na písma','Další výsledky','Žádná odpovídající písma','Výchozí písmo Dynamic','Písmo uložené v hodinkách',
    'Procházet Google Fonts','Hledat v Google Fonts','Rodina písma','Řez','Přidat písmo','Načítání Google Fonts…','Google Fonts se nepodařilo načíst','Písmo z Google Fonts se nepodařilo přidat','Písmo se nepodařilo importovat',
    'Znovu importujte toto písmo v telefonu','Na nová písma není dost místa','Písma se nepodařilo odeslat do hodinek',
  ],
  sk: [
    'Vstavané písma','Uložené písma','Späť na písma','Ďalšie výsledky','Žiadne zodpovedajúce písma','Predvolené písmo Dynamic','Písmo uložené v hodinkách',
    'Prehliadať Google Fonts','Hľadať v Google Fonts','Rodina písma','Rez','Pridať písmo','Načítava sa Google Fonts…','Google Fonts sa nepodarilo načítať','Písmo z Google Fonts sa nepodarilo pridať','Písmo sa nepodarilo importovať',
    'Znova importujte toto písmo v telefóne','Na nové písma nie je dosť miesta','Písma sa nepodarilo odoslať do hodiniek',
  ],
  de: [
    'Integrierte Schriften','Gespeicherte Schriften','Zurück zu den Schriften','Weitere Ergebnisse','Keine passenden Schriften','Dynamic-Standardschrift','Auf der Uhr gespeicherte Schrift',
    'Google Fonts durchsuchen','In Google Fonts suchen','Schriftfamilie','Schriftschnitt','Schrift hinzufügen','Google Fonts wird geladen…','Google Fonts konnte nicht geladen werden','Schrift von Google Fonts konnte nicht hinzugefügt werden','Schrift konnte nicht importiert werden',
    'Diese Schrift auf dem Smartphone erneut importieren','Zu wenig Speicherplatz für die neuen Schriften','Schriften konnten nicht an die Uhr gesendet werden',
  ],
  fr: [
    'Polices intégrées','Polices enregistrées','Retour aux polices','Plus de résultats','Aucune police correspondante','Police par défaut de Dynamic','Police enregistrée sur la montre',
    'Parcourir Google Fonts','Rechercher dans Google Fonts','Famille de polices','Style','Ajouter la police','Chargement de Google Fonts…','Impossible de charger Google Fonts','Impossible d’ajouter la police Google Fonts','Impossible d’importer la police',
    'Réimportez cette police sur le téléphone','Espace insuffisant pour les nouvelles polices','Impossible d’envoyer les polices à la montre',
  ],
  es: [
    'Fuentes integradas','Fuentes guardadas','Volver a las fuentes','Más resultados','No hay fuentes que coincidan','Fuente predeterminada de Dynamic','Fuente guardada en el reloj',
    'Explorar Google Fonts','Buscar en Google Fonts','Familia tipográfica','Estilo','Añadir fuente','Cargando Google Fonts…','No se pudo cargar Google Fonts','No se pudo añadir la fuente de Google Fonts','No se pudo importar la fuente',
    'Vuelve a importar esta fuente en el teléfono','No hay espacio suficiente para las nuevas fuentes','No se pudieron enviar las fuentes al reloj',
  ],
  it: [
    'Caratteri integrati','Caratteri salvati','Torna ai caratteri','Altri risultati','Nessun carattere corrispondente','Carattere predefinito di Dynamic','Carattere salvato sull’orologio',
    'Sfoglia Google Fonts','Cerca in Google Fonts','Famiglia di caratteri','Stile','Aggiungi carattere','Caricamento di Google Fonts…','Impossibile caricare Google Fonts','Impossibile aggiungere il carattere da Google Fonts','Impossibile importare il carattere',
    'Importa di nuovo questo carattere sul telefono','Spazio insufficiente per i nuovi caratteri','Impossibile inviare i caratteri all’orologio',
  ],
  pt: [
    'Tipos de letra integrados','Tipos de letra guardados','Voltar aos tipos de letra','Mais resultados','Nenhum tipo de letra encontrado','Tipo de letra predefinido do Dynamic','Tipo de letra guardado no relógio',
    'Explorar o Google Fonts','Pesquisar no Google Fonts','Família tipográfica','Estilo','Adicionar tipo de letra','A carregar o Google Fonts…','Não foi possível carregar o Google Fonts','Não foi possível adicionar o tipo de letra do Google Fonts','Não foi possível importar o tipo de letra',
    'Volte a importar este tipo de letra no telemóvel','Espaço insuficiente para os novos tipos de letra','Não foi possível enviar os tipos de letra para o relógio',
  ],
  nl: [
    'Ingebouwde lettertypen','Opgeslagen lettertypen','Terug naar lettertypen','Meer resultaten','Geen overeenkomende lettertypen','Standaardlettertype van Dynamic','Lettertype opgeslagen op het horloge',
    'Google Fonts bekijken','Zoeken in Google Fonts','Lettertypefamilie','Stijl','Lettertype toevoegen','Google Fonts laden…','Kan Google Fonts niet laden','Kan het lettertype van Google Fonts niet toevoegen','Kan het lettertype niet importeren',
    'Importeer dit lettertype opnieuw op de telefoon','Onvoldoende ruimte voor de nieuwe lettertypen','Kan de lettertypen niet naar het horloge sturen',
  ],
  pl: [
    'Wbudowane czcionki','Zapisane czcionki','Wróć do czcionek','Więcej wyników','Brak pasujących czcionek','Domyślna czcionka Dynamic','Czcionka zapisana na zegarku',
    'Przeglądaj Google Fonts','Szukaj w Google Fonts','Rodzina czcionek','Styl','Dodaj czcionkę','Wczytywanie Google Fonts…','Nie udało się wczytać Google Fonts','Nie udało się dodać czcionki z Google Fonts','Nie udało się zaimportować czcionki',
    'Zaimportuj ponownie tę czcionkę na telefonie','Za mało miejsca na nowe czcionki','Nie udało się wysłać czcionek na zegarek',
  ],
  da: [
    'Indbyggede skrifttyper','Gemte skrifttyper','Tilbage til skrifttyper','Flere resultater','Ingen matchende skrifttyper','Standardskrifttype i Dynamic','Skrifttype gemt på uret',
    'Gennemse Google Fonts','Søg i Google Fonts','Skriftfamilie','Stil','Tilføj skrifttype','Indlæser Google Fonts…','Kunne ikke indlæse Google Fonts','Kunne ikke tilføje skrifttypen fra Google Fonts','Kunne ikke importere skrifttypen',
    'Importér denne skrifttype igen på telefonen','Der er ikke nok plads til de nye skrifttyper','Kunne ikke sende skrifttyperne til uret',
  ],
  sv: [
    'Inbyggda teckensnitt','Sparade teckensnitt','Tillbaka till teckensnitt','Fler resultat','Inga matchande teckensnitt','Standardteckensnitt i Dynamic','Teckensnitt sparat på klockan',
    'Bläddra i Google Fonts','Sök i Google Fonts','Teckensnittsfamilj','Stil','Lägg till teckensnitt','Läser in Google Fonts…','Kunde inte läsa in Google Fonts','Kunde inte lägga till teckensnittet från Google Fonts','Kunde inte importera teckensnittet',
    'Importera teckensnittet igen på telefonen','Det finns inte tillräckligt med utrymme för de nya teckensnitten','Kunde inte skicka teckensnitten till klockan',
  ],
  no: [
    'Innebygde skrifter','Lagrede skrifter','Tilbake til skrifter','Flere resultater','Ingen samsvarende skrifter','Standardskrift i Dynamic','Skrift lagret på klokken',
    'Bla gjennom Google Fonts','Søk i Google Fonts','Skriftfamilie','Stil','Legg til skrift','Laster inn Google Fonts…','Kunne ikke laste inn Google Fonts','Kunne ikke legge til skriften fra Google Fonts','Kunne ikke importere skriften',
    'Importer denne skriften på nytt på telefonen','Det er ikke nok plass til de nye skriftene','Kunne ikke sende skriftene til klokken',
  ],
  fi: [
    'Sisäänrakennetut fontit','Tallennetut fontit','Takaisin fontteihin','Lisää tuloksia','Vastaavia fontteja ei löytynyt','Dynamicin oletusfontti','Kelloon tallennettu fontti',
    'Selaa Google Fonts -fontteja','Hae Google Fonts -fontteja','Fonttiperhe','Tyyli','Lisää fontti','Ladataan Google Fonts -fontteja…','Google Fonts -fontteja ei voitu ladata','Google Fonts -fonttia ei voitu lisätä','Fontin tuonti epäonnistui',
    'Tuo tämä fontti uudelleen puhelimella','Uusille fonteille ei ole tarpeeksi tilaa','Fonttien lähettäminen kelloon epäonnistui',
  ],
  hu: [
    'Beépített betűtípusok','Mentett betűtípusok','Vissza a betűtípusokhoz','További találatok','Nincs megfelelő betűtípus','A Dynamic alapértelmezett betűtípusa','Az órára mentett betűtípus',
    'Google Fonts böngészése','Keresés a Google Fonts kínálatában','Betűcsalád','Stílus','Betűtípus hozzáadása','Google Fonts betöltése…','A Google Fonts betöltése sikertelen','A Google Fonts-betűtípus hozzáadása sikertelen','A betűtípus importálása sikertelen',
    'Importáld újra ezt a betűtípust a telefonon','Nincs elég hely az új betűtípusoknak','Nem sikerült elküldeni a betűtípusokat az órára',
  ],
  ro: [
    'Fonturi încorporate','Fonturi salvate','Înapoi la fonturi','Mai multe rezultate','Niciun font corespunzător','Fontul implicit al Dynamic','Font salvat pe ceas',
    'Explorează Google Fonts','Caută în Google Fonts','Familie de fonturi','Stil','Adaugă fontul','Se încarcă Google Fonts…','Google Fonts nu a putut fi încărcat','Fontul din Google Fonts nu a putut fi adăugat','Fontul nu a putut fi importat',
    'Importă din nou acest font pe telefon','Spațiu insuficient pentru fonturile noi','Fonturile nu au putut fi trimise pe ceas',
  ],
  tr: [
    'Yerleşik yazı tipleri','Kayıtlı yazı tipleri','Yazı tiplerine dön','Daha fazla sonuç','Eşleşen yazı tipi yok','Dynamic varsayılan yazı tipi','Saatte kayıtlı yazı tipi',
    'Google Fonts’a göz at','Google Fonts’ta ara','Yazı tipi ailesi','Stil','Yazı tipi ekle','Google Fonts yükleniyor…','Google Fonts yüklenemedi','Google Fonts yazı tipi eklenemedi','Yazı tipi içe aktarılamadı',
    'Bu yazı tipini telefonda yeniden içe aktar','Yeni yazı tipleri için yeterli alan yok','Yazı tipleri saate gönderilemedi',
  ],
};

// Display the numeric weight as well as its localized name. Family and
// variant names embedded in saved assets retain their original spelling.
var styles = {
  en:['Thin','Extra Light','Light','Regular','Medium','SemiBold','Bold','Extra Bold','Black','Italic'],
  cs:['Ultratenké','Velmi tenké','Tenké','Normální','Střední','Polotučné','Tučné','Velmi tučné','Nejtučnější','Kurzíva'],
  sk:['Ultratenké','Veľmi tenké','Tenké','Normálne','Stredné','Polotučné','Tučné','Veľmi tučné','Najtučnejšie','Kurzíva'],
  de:['Haarfein','Extraleicht','Leicht','Normal','Mittel','Halbfett','Fett','Extrafett','Schwer','Kursiv'],
  fr:['Ultrafin','Très léger','Léger','Normal','Moyen','Demi-gras','Gras','Très gras','Noir','Italique'],
  es:['Ultrafina','Extraligera','Ligera','Normal','Media','Seminegrita','Negrita','Extranegrita','Muy gruesa','Cursiva'],
  it:['Sottilissimo','Molto leggero','Leggero','Normale','Medio','Semigrassetto','Grassetto','Molto grassetto','Nero','Corsivo'],
  pt:['Fino','Extraleve','Leve','Normal','Médio','Seminegrito','Negrito','Extranegrito','Muito espesso','Itálico'],
  nl:['Flinterdun','Extra licht','Licht','Normaal','Medium','Halfvet','Vet','Extra vet','Zwaar','Cursief'],
  pl:['Bardzo cienka','Bardzo lekka','Lekka','Zwykła','Średnia','Półgruba','Pogrubiona','Bardzo gruba','Najgrubsza','Kursywa'],
  da:['Tynd','Ekstra let','Let','Normal','Mellem','Halvfed','Fed','Ekstra fed','Kraftig','Kursiv'],
  sv:['Tunn','Extra lätt','Lätt','Normal','Medium','Halvfet','Fet','Extra fet','Svart','Kursiv'],
  no:['Tynn','Ekstra lett','Lett','Normal','Middels','Halvfet','Fet','Ekstra fet','Svart','Kursiv'],
  fi:['Ohut','Erittäin kevyt','Kevyt','Normaali','Keskivahva','Puolilihava','Lihava','Erittäin lihava','Vahvin','Kursiivi'],
  hu:['Vékony','Extra világos','Világos','Normál','Közepes','Félkövér','Kövér','Extra kövér','Fekete','Dőlt'],
  ro:['Subțire','Foarte ușor','Ușor','Normal','Mediu','Semialdin','Aldin','Foarte gros','Negru','Cursiv'],
  tr:['İncecik','Çok hafif','Hafif','Normal','Orta','Yarı kalın','Kalın','Çok kalın','En kalın','İtalik'],
};
Object.keys(styles).forEach(function(locale) {
  labels[locale] = labels[locale].concat(styles[locale].map(function(name,index) {
    return index < 9 ? (index+1)*100+' · '+name : name;
  }));
});
module.exports = labels;
