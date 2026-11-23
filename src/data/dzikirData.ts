export interface DzikirItem {
  id: string;
  order: number;
  title: string;
  badge?: string;
  timeType: "both" | "pagi" | "petang";
  count: number;
  countOptions?: number[];
  arabic: string;
  arabicPetang?: string;
  latin: string;
  latinPetang?: string;
  translation: string;
  translationPetang?: string;
  benefits?: string;
  source: string;
}

export const DZIKIR_SOURCE_METADATA = {
  title: "Dzikir Pagi dan Petang",
  compiler: "Al-Ustadz Yazid bin 'Abdul Qadir Jawas رحمه الله",
  book: "Do'a dan Wirid Mengobati Guna-guna dan Sihir Menurut Al-Qur'an dan As-Sunnah",
  publisher: "Pustaka Imam Asy-Syafi'i - Jakarta",
  url: "https://almanhaj.or.id/11518-dzikir-pagi-dan-petang.html"
};

export const DZIKIR_LIST: DzikirItem[] = [
  {
    id: "ayat-kursi",
    order: 1,
    title: "Ayat Kursi (QS. Al-Baqarah: 255)",
    badge: "Pelindung dari Jin & Setan",
    timeType: "both",
    count: 1,
    arabic: "اللَّهُ لَا إِلَهَ إِلَّا هُوَ الْحَيُّ الْقَيُّومُ ۚ لَا تَأْخُذُهُ سِنَةٌ وَلَا نَوْمٌ ۚ لَهُ مَا فِي السَّمَاوَاتِ وَمَا فِي الْأَرْضِ ۗ مَنْ ذَا الَّذِي يَشْفَعُ عِنْدَهُ إِلَّا بِإِذْنِهِ ۚ يَعْلَمُ مَا بَيْنَ أَيْدِيهِمْ وَمَا خَلْفَهُمْ ۖ وَلَا يُحِيطُونَ بِشَيْءٍ مِنْ عِلْمِهِ إِلَّا بِمَا شَاءَ ۚ وَسِعَ كُرْسِيُّهُ السَّمَاوَاتِ وَالْأَرْضَ ۖ وَلَا يَئُودُهُ حِفْظُهُمَا ۚ وَهُوَ الْعَلِيُّ الْعَظِيمُ",
    latin: "Allahu laa ilaaha illaa huwal hayyul qoyyuum, laa ta'khudzuhuu sinatuw walaa na'uum, lahuu maa fis samaawaati wa maa fil ardh, man dzalladzii yasyfa'u 'indahuu illaa bi idznih, ya'lamu maa baina aydiihim wa maa kholfahum, wa laa yuhiithuuna bisyai-im min 'ilmihii illaa bimaa syaa-a, wasi'a kursiyyuhus samaawaati wal ardh, wa laa ya-uuduhuu hifzhuhumaa, wa huwal 'aliyyul 'azhiim.",
    translation: "Allah, tidak ada Tuhan (yang berhak disembah) melainkan Dia, Yang Hidup kekal lagi terus-menerus mengurus makhluk-Nya. Dia tidak mengantuk dan tidak tidur. Kepunyaan-Nya apa yang di langit dan di bumi. Tiada yang dapat memberi syafaat di sisi-Nya tanpa izin-Nya. Dia mengetahui apa-apa yang di hadapan mereka dan di belakang mereka. Mereka tidak mengetahui apa-apa dari ilmu-Nya melainkan apa yang dikehendaki-Nya. Kursi Allah meliputi langit dan bumi. Dia tidak merasa berat memelihara keduanya. Dan Dia Maha Tinggi lagi Maha Besar.",
    benefits: "Siapa yang membacanya ketika petang, maka ia akan dijaga oleh Allah dari (gangguan) jin hingga pagi. Siapa yang membacanya ketika pagi, maka ia akan dijaga oleh Allah dari gangguan jin hingga petang.",
    source: "HR. Al-Hakim (1/562), Shahih At-Targhib wat Tarhib (1/418 no. 662), Shahih"
  },
  {
    id: "al-ikhlas",
    order: 2,
    title: "Surat Al-Ikhlas (3x)",
    badge: "Pencukup Segala Sesuatu",
    timeType: "both",
    count: 3,
    arabic: "بِسْمِ اللَّهِ الرَّحْمَنِ الرَّحِيمِ\nقُلْ هُوَ اللَّهُ أَحَدٌ ۞ اللَّهُ الصَّمَدُ ۞ لَمْ يَلِدْ وَلَمْ يُولَدْ ۞ وَلَمْ يَكُنْ لَهُ كُفُوًا أَحَدٌ",
    latin: "Bismillaahir rohmaanir rohiim. Qul huwallaahu ahad. Allaahush shomad. Lam yalid wa lam yuulad. Wa lam yakul lahuu kufuwan ahad.",
    translation: "Dengan menyebut nama Allah Yang Maha Pengasih lagi Maha Penyayang. Katakanlah: Dialah Allah, Yang Maha Esa. Allah adalah Rabb yang bergantung kepada-Nya segala urusan. Dia tidak beranak dan tiada pula diperanakkan, dan tidak ada seorang pun yang setara dengan Dia.",
    benefits: "Siapa yang membacanya bersama Al-Falaq dan An-Naas masing-masing 3 kali ketika pagi dan petang, maka segala sesuatu akan dicukupkan untuknya.",
    source: "HR. Abu Dawud no. 5082, An-Nasa'i (VIII/250), At-Tirmidzi no. 3575, Ahmad (V/312), Shahih At-Targhib wat Tarhib (1/411 no. 649), Hasan Shahih"
  },
  {
    id: "al-falaq",
    order: 3,
    title: "Surat Al-Falaq (3x)",
    badge: "Perlindungan Kejahatan Makhluk",
    timeType: "both",
    count: 3,
    arabic: "بِسْمِ اللَّهِ الرَّحْمَنِ الرَّحِيمِ\nقُلْ أَعُوذُ بِرَبِّ الْفَلَقِ ۞ مِنْ شَرِّ مَا خَلَقَ ۞ وَمِنْ شَرِّ غَاسِقٍ إِذَا وَقَبَ ۞ وَمِنْ شَرِّ النَّفَّاثَاتِ فِي الْعُقَدِ ۞ وَمِنْ شَرِّ حَاسِدٍ إِذَا حَسَدَ",
    latin: "Bismillaahir rohmaanir rohiim. Qul a'uudzu birobbil falaq. Min syarri maa kholaq. Wa min syarri ghoosiqin idzaa waqob. Wa min syarrin naffaatsaati fil 'uqod. Wa min syarri haasidin idzaa hasad.",
    translation: "Dengan menyebut nama Allah Yang Maha Pengasih lagi Maha Penyayang. Katakanlah: Aku berlindung kepada Rabb yang menguasai subuh, dari kejahatan makhluk-Nya, dan dari kejahatan malam apabila telah gelap gulita, dan dari kejahatan wanita-wanita tukang sihir yang menghembus pada buhul-buhul, dan dari kejahatan pendengki apabila ia dengki.",
    benefits: "Dibaca 3x saat pagi dan petang sebagai pelindung dari kejahatan sihir, malam gelap, dan rasa dengki.",
    source: "HR. Abu Dawud no. 5082, An-Nasa'i (VIII/250), At-Tirmidzi no. 3575, Ahmad (V/312), Shahih At-Targhib wat Tarhib (1/411 no. 649), Hasan Shahih"
  },
  {
    id: "an-naas",
    order: 4,
    title: "Surat An-Naas (3x)",
    badge: "Benteng dari Bisikan Setan",
    timeType: "both",
    count: 3,
    arabic: "بِسْمِ اللَّهِ الرَّحْمَنِ الرَّحِيمِ\nقُلْ أَعُوذُ بِرَبِّ النَّاسِ ۞ مَلِكِ النَّاسِ ۞ إِلَهِ النَّاسِ ۞ مِنْ شَرِّ الْوَسْوَاسِ الْخَنَّاسِ ۞ الَّذِي يُوَسْوِسُ فِي صُدُورِ النَّاسِ ۞ مِنَ الْجِنَّةِ وَالنَّاسِ",
    latin: "Bismillaahir rohmaanir rohiim. Qul a'uudzu birobbin naas. Malikin naas. Ilaahin naas. Min syarril waswaasil khon-naas. Alladzii yuwaswisu fii shuduurin naas. Minal jinnati wan naas.",
    translation: "Dengan menyebut nama Allah Yang Maha Pengasih lagi Maha Penyayang. Katakanlah: Aku berlindung kepada Rabb manusia. Raja manusia. Sembahan manusia, dari kejahatan (bisikan) setan yang biasa bersembunyi, yang membisikkan (kejahatan) ke dalam dada manusia, dari golongan jin dan manusia.",
    benefits: "Dicukupkan dari segala marabahaya jika dibaca rutin 3x setiap pagi dan petang.",
    source: "HR. Abu Dawud no. 5082, An-Nasa'i (VIII/250), At-Tirmidzi no. 3575, Ahmad (V/312), Shahih At-Targhib wat Tarhib (1/411 no. 649), Hasan Shahih"
  },
  {
    id: "ashbahna-mulk",
    order: 5,
    title: "Dzikir Kerajaan Milik Allah & Doa Kebaikan Hari",
    badge: "Doa Perlindungan Hari",
    timeType: "both",
    count: 1,
    arabic: "أَصْبَحْنَا وَأَصْبَحَ الْمُلْكُ لِلَّهِ، وَالْحَمْدُ لِلَّهِ، لَا إِلَهَ إِلَّا اللَّهُ وَحْدَهُ لَا شَرِيكَ لَهُ، لَهُ الْمُلْكُ وَلَهُ الْحَمْدُ وَهُوَ عَلَى كُلِّ شَيْءٍ قَدِيرٌ، رَبِّ أَسْأَلُكَ خَيْرَ مَا فِي هَذَا الْيَوْمِ وَخَيْرَ مَا بَعْدَهُ، وَأَعُوذُ بِكَ مِنْ شَرِّ مَا فِي هَذَا الْيَوْمِ وَشَرِّ مَا بَعْدَهُ، رَبِّ أَعُوذُ بِكَ مِنَ الْكَسَلِ وَسُوءِ الْكِبَرِ، رَبِّ أَعُوذُ بِكَ مِنْ عَذَابٍ فِي النَّارِ وَعَذَابٍ فِي الْقَبْرِ",
    arabicPetang: "أَمْسَيْنَا وَأَمْسَى الْمُلْكُ لِلَّهِ، وَالْحَمْدُ لِلَّهِ، لَا إِلَهَ إِلَّا اللَّهُ وَحْدَهُ لَا شَرِيكَ لَهُ، لَهُ الْمُلْكُ وَلَهُ الْحَمْدُ وَهُوَ عَلَى كُلِّ شَيْءٍ قَدِيرٌ، رَبِّ أَسْأَلُكَ خَيْرَ مَا فِي هَذِهِ اللَّيْلَةِ وَخَيْرَ مَا بَعْدَهَا، وَأَعُوذُ بِكَ مِنْ شَرِّ مَا فِي هَذِهِ اللَّيْلَةِ وَشَرِّ مَا بَعْدَهَا، رَبِّ أَعُوذُ بِكَ مِنَ الْكَسَلِ وَسُوءِ الْكِبَرِ، رَبِّ أَعُوذُ بِكَ مِنْ عَذَابٍ فِي النَّارِ وَعَذَابٍ فِي الْقَبْرِ",
    latin: "Ashbahnaa wa ashbahal mulku lillah, wal hamdu lillah, laa ilaaha illallahu wahdahu laa syariika lah, lahul mulku wa lahul hamdu wa huwa 'ala kulli syai-in qodiir. Robbi as-aluka khoiro maa fii haadzal yaumi wa khoiro maa ba'dahu, wa a'uudzu bika min syarri maa fii haadzal yaumi wa syarri maa ba'dahu, robbi a'uudzu bika minal kasali wa suu-il kibar, robbi a'uudzu bika min 'adzaabin fin naari wa 'adzaabin fil qobr.",
    latinPetang: "Amsaynaa wa amsal mulku lillah, wal hamdu lillah, laa ilaaha illallahu wahdahu laa syariika lah, lahul mulku wa lahul hamdu wa huwa 'ala kulli syai-in qodiir. Robbi as-aluka khoiro maa fii haadzihil lailati wa khoiro maa ba'dahaa, wa a'uudzu bika min syarri maa fii haadzihil lailati wa syarri maa ba'dahaa, robbi a'uudzu bika minal kasali wa suu-il kibar, robbi a'uudzu bika min 'adzaabin fin naari wa 'adzaabin fil qobr.",
    translation: "Kami telah memasuki waktu pagi dan kerajaan hanya milik Allah, segala puji bagi Allah. Tidak ada ilah yang berhak disembah selain Allah semata, tiada sekutu bagi-Nya. Milik-Nya kerajaan dan bagi-Nya segala pujian. Dia Mahakuasa atas segala sesuatu. Wahai Rabb-ku, aku mohon kepada-Mu kebaikan di hari ini dan kebaikan sesudahnya. Aku berlindung kepada-Mu dari kejahatan di hari ini dan kejahatan sesudahnya. Rabb-ku, aku berlindung kepada-Mu dari kemalasan dan kejelekan di hari tua. Rabb-ku, aku berlindung kepada-Mu dari siksaan di neraka dan siksaan di kubur.",
    translationPetang: "Kami telah memasuki waktu petang dan kerajaan hanya milik Allah, segala puji bagi Allah. Tidak ada ilah yang berhak disembah selain Allah semata, tiada sekutu bagi-Nya. Milik-Nya kerajaan dan bagi-Nya segala pujian. Dia Mahakuasa atas segala sesuatu. Wahai Rabb-ku, aku mohon kepada-Mu kebaikan di malam ini dan kebaikan sesudahnya. Aku berlindung kepada-Mu dari kejahatan di malam ini dan kejahatan sesudahnya...",
    benefits: "Memohon perlindungan dari kemalasan, kepikunan di hari tua, siksa kubur, dan api neraka di permulaan pagi dan petang.",
    source: "HR. Muslim no. 2723 (75), Abu Dawud no. 5071, At-Tirmidzi no. 3390, Shahih dari Abdullah bin Mas'ud radhiyallahu 'anhu"
  },
  {
    id: "bika-ashbahna",
    order: 6,
    title: "Penyerahan Diri kepada Allah Pagi & Petang",
    badge: "Ketundukan Hati",
    timeType: "both",
    count: 1,
    arabic: "اَللَّهُمَّ بِكَ أَصْبَحْنَا، وَبِكَ أَمْسَيْنَا، وَبِكَ نَحْيَا، وَبِكَ نَمُوتُ، وَإِلَيْكَ النُّشُورُ",
    arabicPetang: "اَللَّهُمَّ بِكَ أَمْسَيْنَا، وَبِكَ أَصْبَحْنَا، وَبِكَ نَحْيَا، وَبِكَ نَمُوتُ، وَإِلَيْكَ الْمَصِيرُ",
    latin: "Allahumma bika ashbahnaa, wa bika amsaynaa, wa bika nahyaa, wa bika namuutu, wa ilaykan nusyuur.",
    latinPetang: "Allahumma bika amsaynaa, wa bika ashbahnaa, wa bika nahyaa, wa bika namuutu, wa ilaykal mashiir.",
    translation: "Ya Allah, dengan rahmat dan pertolongan-Mu kami memasuki waktu pagi, dan dengan rahmat dan pertolongan-Mu kami memasuki waktu petang. Dengan kehendak-Mu kami hidup dan mati, dan kepada-Mu tempat kebangkitan (bagi semua makhluk).",
    translationPetang: "Ya Allah, dengan rahmat dan pertolongan-Mu kami memasuki waktu petang, dan dengan rahmat dan pertolongan-Mu kami memasuki waktu pagi. Dengan kehendak-Mu kami hidup dan mati, dan kepada-Mu tempat kembali.",
    benefits: "Menyandarkan seluruh hidup, mati, serta hari berbangkit hanya kepada pertolongan dan rahmat Allah.",
    source: "HR. Al-Bukhari dalam Al-Adabul Mufrad no. 1199, At-Tirmidzi no. 3391, Abu Dawud no. 5068, Ahmad (II/354), Ibnu Majah no. 3868, Shahih Al-Adabil Mufrad no. 911"
  },
  {
    id: "sayyidul-istighfar",
    order: 7,
    title: "Sayyidul Istighfar (Penghulu Istighfar)",
    badge: "Jaminan Surga",
    timeType: "both",
    count: 1,
    arabic: "اَللَّهُمَّ أَنْتَ رَبِّي لَا إِلَهَ إِلَّا أَنْتَ، خَلَقْتَنِي وَأَنَا عَبْدُكَ، وَأَنَا عَلَى عَهْدِكَ وَوَعْدِكَ مَا اسْتَطَعْتُ، أَعُوذُ بِكَ مِنْ شَرِّ مَا صَنَعْتُ، أَبُوءُ لَكَ بِنِعْمَتِكَ عَلَيَّ، وَأَبُوءُ بِذَنْبِي فَاغْفِرْ لِي فَإِنَّهُ لَا يَغْفِرُ الذُّنُوبَ إِلَّا أَنْتَ",
    latin: "Allahumma anta robbii laa ilaaha illaa anta, kholaqtanii wa anaa 'abduka, wa anaa 'alaa 'ahdika wa wa'dika mastatha'tu, a'uudzu bika min syarri maa shona'tu, abuu-u laka bini'matika 'alayya, wa abuu-u bidzambii faghfir lii fa innahu laa yaghfirudz dzunuuba illaa anta.",
    translation: "Ya Allah, Engkau adalah Rabb-ku, tidak ada ilah (yang berhak diibadahi dengan benar) kecuali Engkau. Engkaulah yang menciptakanku dan aku adalah hamba-Mu. Aku akan setia pada perjanjianku dengan-Mu semampuku. Aku berlindung kepada-Mu dari kejelekan apa yang kuperbuat. Aku mengakui nikmat-Mu kepadaku dan aku mengakui dosaku, oleh karena itu ampunilah aku. Sesungguhnya tiada yang dapat mengampuni dosa kecuali Engkau.",
    benefits: "Barangsiapa mengucapkannya di siang hari dengan penuh keyakinan lalu mati sebelum sore hari, ia termasuk penghuni surga. Dan barangsiapa mengucapkannya di malam hari dengan yakin lalu mati sebelum subuh, maka ia termasuk penghuni surga.",
    source: "HR. Al-Bukhari no. 6306, 6323, Ahmad (IV/122-125), An-Nasa'i (VIII/279-280) dari Syaddad bin Aus radhiyallahu 'anhu"
  },
  {
    id: "aafinii-badanii",
    order: 8,
    title: "Doa Afiat Tubuh, Pendengaran, Penglihatan (3x)",
    badge: "Kesehatan & Anti Kekufuran",
    timeType: "both",
    count: 3,
    arabic: "اَللَّهُمَّ عَافِنِي فِي بَدَنِي، اَللَّهُمَّ عَافِنِي فِي سَمْعِي، اَللَّهُمَّ عَافِنِي فِي بَصَرِي، لَا إِلَهَ إِلَّا أَنْتَ. اَللَّهُمَّ إِنِّي أَعُوذُ بِكَ مِنَ الْكُفْرِ وَالْفَقْرِ، وَأَعُوذُ بِكَ مِنْ عَذَابِ الْقَبْرِ، لَا إِلَهَ إِلَّا أَنْتَ",
    latin: "Allahumma 'aafinii fii badanii, Allahumma 'aafinii fii sam'ii, Allahumma 'aafinii fii bashorii, laa ilaaha illaa anta. Allahumma innii a'uudzu bika minal kufri wal faqr, wa a'uudzu bika min 'adzaabil qobr, laa ilaaha illaa anta.",
    translation: "Ya Allah, selamatkanlah tubuhku (dari penyakit dan hal yang tidak disukai). Ya Allah, selamatkanlah pendengaranku. Ya Allah selamatkanlah penglihatanku, tidak ada ilah kecuali Engkau. Ya Allah, sesungguhnya aku berlindung kepada-Mu dari kekafiran dan kefakiran. Aku berlindung kepada-Mu dari siksa kubur, tidak ada ilah selain Engkau.",
    benefits: "Menjaga kesehatan panca indera, menjauhkan dari jeratan kefakiran yang melalaikan, dan siksa kubur.",
    source: "HR. Al-Bukhari dalam Shahih Al-Adabil Mufrad no. 701, Abu Dawud no. 5090, Ahmad (V/42), Shahih Al-Adabil Mufrad no. 539, Hasan"
  },
  {
    id: "as-alukal-afwa",
    order: 9,
    title: "Doa Memohon Perlindungan 5 Penjuru & Afiat",
    badge: "Benteng Penjuru Arah",
    timeType: "both",
    count: 1,
    arabic: "اَللَّهُمَّ إِنِّي أَسْأَلُكَ الْعَفْوَ وَالْعَافِيَةَ فِي الدُّنْيَا وَالْآخِرَةِ، اَللَّهُمَّ إِنِّي أَسْأَلُكَ الْعَفْوَ وَالْعَافِيَةَ فِي دِينِي وَدُنْيَايَ وَأَهْلِي وَمَالِي، اَللَّهُمَّ اسْتُرْ عَوْرَاتِي وَآمِنْ رَوْعَاتِي، اَللَّهُمَّ احْفَظْنِي مِنْ بَيْنِ يَدَيَّ، وَمِنْ خَلْفِي، وَعَنْ يَمِينِي، وَعَنْ شِمَالِي، وَمِنْ فَوْقِي، وَأَعُوذُ بِعَظَمَتِكَ أَنْ أُغْتَالَ مِنْ تَحْتِي",
    latin: "Allahumma innii as-alukal 'afwa wal 'aafiyah fid dunyaa wal aakhiroh. Allahumma innii as-alukal 'afwa wal 'aafiyah fii diinii wa dunyaaya wa ahlii wa maalii. Allahummastur 'awrootii wa aamin row'aatii. Allahummahfazhnii mim bayni yadayya, wa min kholfii, wa 'an yamiinii, wa 'an syimaalii, wa min fawqii, wa a'uudzu bi'azhomatika an ughtaala min tahtii.",
    translation: "Ya Allah, sesungguhnya aku memohon kebajikan dan keselamatan di dunia dan akhirat. Ya Allah, sesungguhnya aku memohon ampunan dan keselamatan dalam urusan agama, dunia, keluarga, dan hartaku. Ya Allah, tutupilah aib-aibku dan tentramkanlah aku dari rasa takut. Ya Allah, peliharalah aku dari depan, belakang, kanan, kiri, dan dari atasku. Aku berlindung dengan kebesaran-Mu agar tidak disambar (dibenamkan ke dalam bumi) dari bawahku.",
    benefits: "Doa yang tidak pernah ditinggalkan oleh Rasulullah ﷺ setiap pagi dan sore untuk menjaga keselamatan diri, keluarga, dan kehormatan.",
    source: "HR. Al-Bukhari dalam Al-Adabul Mufrad no. 1200, Abu Dawud no. 5074, An-Nasa'i (VIII/282), Ibnu Majah no. 3871, Al-Hakim (1/517-518), Shahih Al-Adabil Mufrad no. 912"
  },
  {
    id: "aalimal-ghoyb",
    order: 10,
    title: "Doa Perlindungan dari Godaan Setan & Kejahatan Diri",
    badge: "Perisai Jiwa",
    timeType: "both",
    count: 1,
    arabic: "اَللَّهُمَّ عَالِمَ الْغَيْبِ وَالشَّهَادَةِ، فَاطِرَ السَّمَاوَاتِ وَالْأَرْضِ، رَبَّ كُلِّ شَيْءٍ وَمَلِيكَهُ، أَشْهَدُ أَنْ لَا إِلَهَ إِلَّا أَنْتَ، أَعُوذُ بِكَ مِنْ شَرِّ نَفْسِي، وَمِنْ شَرِّ الشَّيْطَانِ وَشِرْكِهِ، وَأَنْ أَقْتَرِفَ عَلَى نَفْسِي سُوءًا أَوْ أَجُرَّهُ إِلَى مُسْلِمٍ",
    latin: "Allahumma 'aalimal ghoibi wash syahaadah, faathiros samaawaati wal ardh, robba kulli syai-in wa maliikah, asyhadu an laa ilaaha illaa anta, a'uudzu bika min syarri nafsii, wa min syarrisy syaithooni wa syirkih, wa an aqtarifa 'alaa nafsii suu-an aw ajurrohuu ilaa muslim.",
    translation: "Ya Allah Yang Maha Mengetahui yang gaib dan yang nyata, wahai Rabb Pencipta langit dan bumi, Rabb atas segala sesuatu dan Yang Merajainya. Aku bersaksi bahwa tidak ada ilah kecuali Engkau. Aku berlindung kepada-Mu dari kejahatan diriku, setan dan sekutunya, serta dari berbuat kejelekan atas diriku sendiri atau mendorong seorang muslim kepadanya.",
    benefits: "Doa wasiat Rasulullah ﷺ kepada sahabat Abu Bakr Ash-Shiddiq radhiyallahu 'anhu untuk dibaca saat pagi, petang, dan saat berbaring hendak tidur.",
    source: "HR. Al-Bukhari dalam Al-Adabul Mufrad no. 1202, At-Tirmidzi no. 3392, Abu Dawud no. 5067, Shahih At-Tirmidzi no. 2798, Shahih Al-Adabil Mufrad no. 914"
  },
  {
    id: "bismillahilladzi",
    order: 11,
    title: "Benteng dengan Nama Allah dari Segala Bahaya (3x)",
    badge: "Anti Bahaya & Racun",
    timeType: "both",
    count: 3,
    arabic: "بِسْمِ اللَّهِ الَّذِي لَا يَضُرُّ مَعَ اسْمِهِ شَيْءٌ فِي الْأَرْضِ وَلَا فِي السَّمَاءِ وَهُوَ السَّمِيعُ الْعَلِيمُ",
    latin: "Bismillahilladzii laa yadhurru ma'asmihii syai-un fil ardhi wa laa fis samaa-i wa huwas samii'ul 'aliim.",
    translation: "Dengan nama Allah yang tidak ada bahaya bersama nama-Nya sesuatu apa pun di bumi maupun di langit. Dan Dia Maha Mendengar lagi Maha Mengetahui.",
    benefits: "Barangsiapa mengucapkannya sebanyak 3 kali di subuh hari dan 3 kali di petang hari, maka tidak ada suatu apa pun yang dapat membahayakan dirinya.",
    source: "HR. At-Tirmidzi no. 3388, Abu Dawud no. 5088, Ibnu Majah no. 3869, Ahmad no. 446 & 474, Al-Hakim (1/514), Shahih At-Targhib wat Tarhib (1/413 no. 655)"
  },
  {
    id: "rodhiitu-billah",
    order: 12,
    title: "Keridhaan kepada Allah, Islam, & Rasulullah (3x)",
    badge: "Jaminan Ridho Ilahi",
    timeType: "both",
    count: 3,
    arabic: "رَضِيتُ بِاللَّهِ رَبًّا، وَبِالْإِسْلَامِ دِينًا، وَبِمُحَمَّدٍ صَلَّى اللَّهُ عَلَيْهِ وَسَلَّمَ نَبِيًّا",
    latin: "Rodhiitu billaahi robbaa, wa bil-islaami diinaa, wa bi-muhammadin shollallaahu 'alayhi wa sallama nabiyyaa.",
    translation: "Aku rela (ridha) Allah sebagai Rabb-ku, Islam sebagai agamaku, dan Muhammad shallallahu 'alaihi wa sallam sebagai Nabiku (yang diutus oleh Allah).",
    benefits: "Barangsiapa mengucapkannya sebanyak 3 kali di pagi hari dan 3 kali di petang hari, maka pantas baginya mendapatkan ridho Allah di hari kiamat kelak.",
    source: "HR. Ahmad (IV/337), Abu Dawud no. 5072, At-Tirmidzi no. 3389, Ibnu Majah no. 3870, Al-Hakim (1/518), Shahih At-Targhib wat Tarhib (1/415 no. 657), Hasan"
  },
  {
    id: "yaa-hayyu-yaa-qoyyum",
    order: 13,
    title: "Istighotsah Memohon Perbaikan Segala Urusan",
    badge: "Doa Solusi Kehidupan",
    timeType: "both",
    count: 1,
    arabic: "يَا حَيُّ يَا قَيُّومُ بِرَحْمَتِكَ أَسْتَغِيثُ، أَصْلِحْ لِي شَأْنِي كُلَّهُ وَلَا تَكِلْنِي إِلَى نَفْسِي طَرْفَةَ عَيْنٍ",
    latin: "Yaa Hayyu Yaa Qoyyuum, birohmatika astaghiits, ashlih lii sya'nii kullahu wa laa takilnii ilaa nafsii thorfata 'ayn.",
    translation: "Wahai Rabb Yang Mahahidup, wahai Rabb Yang Mahaberdiri Sendiri (tidak butuh segala sesuatu), dengan rahmat-Mu aku memohon pertolongan. Perbaikilah segala urusanku dan janganlah Engkau serahkan aku kepada diriku sendiri walau sekejap mata sekali pun.",
    benefits: "Memohon bimbingan Ilahi agar tidak terjerumus dalam ego sendiri walau hanya sekedip mata.",
    source: "HR. An-Nasa'i dalam 'Amalul Yaum wal Lailah no. 575, Al-Hakim (1/545), Shahih At-Targhib wat Tarhib (1/417 no. 661), Silsilah Ash-Shahihah no. 227, Hasan"
  },
  {
    id: "fithrotil-islam",
    order: 14,
    title: "Penegasan Fitrah Islam & Agama Nabi Ibrahim",
    badge: "Keteguhan Tauhid",
    timeType: "both",
    count: 1,
    arabic: "أَصْبَحْنَا عَلَى فِطْرَةِ الْإِسْلَامِ، وَعَلَى كَلِمَةِ الْإِخْلَاصِ، وَعَلَى دِينِ نَبِيِّنَا مُحَمَّدٍ صَلَّى اللَّهُ عَلَيْهِ وَسَلَّمَ، وَعَلَى مِلَّةِ أَبِينَا إِبْرَاهِيمَ حَنِيفًا مُسْلِمًا وَمَا كَانَ مِنَ الْمُشْرِكِينَ",
    arabicPetang: "أَمْسَيْنَا عَلَى فِطْرَةِ الْإِسْلَامِ، وَعَلَى كَلِمَةِ الْإِخْلَاصِ، وَعَلَى دِينِ نَبِيِّنَا مُحَمَّدٍ صَلَّى اللَّهُ عَلَيْهِ وَسَلَّمَ، وَعَلَى مِلَّةِ أَبِينَا إِبْرَاهِيمَ حَنِيفًا مُسْلِمًا وَمَا كَانَ مِنَ الْمُشْرِكِينَ",
    latin: "Ashbahnaa 'alaa fithrotil islaam, wa 'alaa kalimatil ikhlaash, wa 'alaa diini nabiyyinaa Muhammadin shollallaahu 'alayhi wa sallam, wa 'alaa millati abiinaa Ibroohiima haniifam muslimaw wamaa kaana minal musyrikiin.",
    latinPetang: "Amsaynaa 'alaa fithrotil islaam, wa 'alaa kalimatil ikhlaash, wa 'alaa diini nabiyyinaa Muhammadin shollallaahu 'alayhi wa sallam, wa 'alaa millati abiinaa Ibroohiima haniifam muslimaw wamaa kaana minal musyrikiin.",
    translation: "Di waktu pagi kami berada di atas fitrah agama Islam, kalimat ikhlas (dua kalimah syahadat), agama Nabi kami Muhammad shallallahu 'alaihi wa sallam dan agama ayah kami Ibrahim yang berdiri di atas jalan yang lurus, muslim dan tidak tergolong orang-orang musyrik.",
    translationPetang: "Di waktu petang kami berada di atas fitrah agama Islam, kalimat ikhlas, agama Nabi kami Muhammad shallallahu 'alaihi wa sallam...",
    benefits: "Memperbaharui ikrar tauhid dan komitmen mengikuti jejak para nabi setiap pagi dan petang.",
    source: "HR. Ahmad (III/406, 407), Ad-Darimi (II/292), Ibnus Sunni no. 34, Shahih Al-Jaami'ish Shaghiir no. 4674, Shahih"
  },
  {
    id: "tahlil-100",
    order: 15,
    title: "Kalimat Tauhid (Tahlil 10x atau 100x)",
    badge: "Pahala Bebaskan Budak",
    timeType: "both",
    count: 10,
    countOptions: [10, 100],
    arabic: "لَا إِلَهَ إِلَّا اللَّهُ وَحْدَهُ لَا شَرِيكَ لَهُ، لَهُ الْمُلْكُ وَلَهُ الْحَمْدُ وَهُوَ عَلَى كُلِّ شَيْءٍ قَدِيرٌ",
    latin: "Laa ilaaha illallahu wahdahu laa syariika lah, lahul mulku wa lahul hamdu wa huwa 'ala kulli syai-in qodiir.",
    translation: "Tidak ada ilah (yang berhak diibadahi dengan benar) selain Allah Yang Mahaesa, tidak ada sekutu bagi-Nya. Bagi-Nya kerajaan dan bagi-Nya segala puji. Dan Dia Mahakuasa atas segala sesuatu.",
    benefits: "Jika dibaca 100x sehari: seperti memerdekakan 10 budak, dicatat 100 kebaikan, dihapus 100 kesalahan, dan terlindung dari setan seharian penuh. Jika dibaca 10x: Allah mencatat 10 kebaikan, menghapus 10 dosa, setara memerdekakan 10 budak.",
    source: "HR. Al-Bukhari no. 3293, 6403, Muslim (IV/2071 no. 2691), Abu Dawud no. 5077, Ibnu Majah no. 3798, Shahih Al-Jaami' no. 6418"
  },
  {
    id: "adada-kholqih",
    order: 16,
    title: "Tasbih Seberat Arsy & Tinta Kalimat-Nya (3x)",
    badge: "Khusus Pagi",
    timeType: "pagi",
    count: 3,
    arabic: "سُبْحَانَ اللَّهِ وَبِحَمْدِهِ، عَدَدَ خَلْقِهِ، وَرِضَا نَفْسِهِ، وَزِنَةَ عَرْشِهِ، وَمِدَادَ كَلِمَاتِهِ",
    latin: "Subhaanallaahi wa bihamdih, 'adada kholqih, wa ridhoo nafsih, wa zinata 'arsyih, wa midaada kalimaatih.",
    translation: "Mahasuci Allah, aku memuji-Nya sebanyak bilangan makhluk-Nya, Mahasuci Allah sesuai keridhaan diri-Nya, Mahasuci seberat timbangan 'Arsy-Nya, dan Mahasuci sebanyak tinta (yang menulis) kalimat-Nya.",
    benefits: "Nabi shallallahu 'alaihi wa sallam bersabda kepada Juwairiyah radhiyallahu 'anha bahwa dzikir ini melampaui dan mengungguli dzikir yang dibaca berjam-jam dari subuh hingga waktu dhuha.",
    source: "HR. Muslim no. 2726, Syarah Muslim (XVII/44) dari Juwairiyah binti Al-Harits radhiyallahu 'anhuma"
  },
  {
    id: "ilman-naafia",
    order: 17,
    title: "Doa Memohon Ilmu, Rezeki Halal, & Amal Diterima",
    badge: "Khusus Pagi",
    timeType: "pagi",
    count: 1,
    arabic: "اَللَّهُمَّ إِنِّي أَسْأَلُكَ عِلْمًا نَافِعًا، وَرِزْقًا طَيِّبًا، وَعَمَلًا مُتَقَبَّلًا",
    latin: "Allahumma innii as-aluka 'ilman naafi'aa, wa rizqon thoyyibaa, wa 'amalam mutaqobbalaa.",
    translation: "Ya Allah, sesungguhnya aku meminta kepada-Mu ilmu yang bermanfaat, rezeki yang halal dan baik, serta amalan yang diterima di sisi-Mu.",
    benefits: "Dibaca setelah shalat subuh untuk membuka hari dengan fokus pada tiga pilar keberkahan hidup: ilmu, nafkah, dan amal shaleh.",
    source: "HR. Ibnu Majah no. 925, Ibnus Sunni no. 54, 110, Ahmad (VI/294), Shahih Ibni Majah (1/152 no. 753) dari Ummu Salamah radhiyallahu 'anha"
  },
  {
    id: "bikalimaatillah",
    order: 18,
    title: "Perlindungan dari Binatang Berbisa & Marabahaya",
    badge: "Khusus Petang",
    timeType: "petang",
    count: 3,
    arabic: "أَعُوذُ بِكَلِمَاتِ اللَّهِ التَّامَّاتِ مِنْ شَرِّ مَا خَلَقَ",
    latin: "A'uudzu bikalimaatillaahit taammaati min syarri maa kholaq.",
    translation: "Aku berlindung dengan kalimat-kalimat Allah yang sempurna dari kejahatan makhluk yang telah Dia ciptakan.",
    benefits: "Barangsiapa mengucapkannya 3 kali di petang hari, tidak akan ada sengatan atau racun binatang berbisa yang dapat mencelakakannya pada malam itu.",
    source: "HR. Ahmad (II/290), An-Nasa'i dalam 'Amalul Yaum wal Lailah no. 596, Shahih At-Targhib wat Tarhib (1/412 no. 652), Shahih Al-Jaami' no. 6427"
  },
  {
    id: "subhanallah-100",
    order: 19,
    title: "Tasbih 100x Penggugur Dosa",
    badge: "100x Penggugur Dosa",
    timeType: "both",
    count: 100,
    arabic: "سُبْحَانَ اللَّهِ وَبِحَمْدِهِ",
    latin: "Subhaanallaahi wa bihamdih.",
    translation: "Mahasuci Allah, dan aku memuji-Nya.",
    benefits: "Barangsiapa yang mengucapkan kalimat ini di pagi dan petang hari sebanyak 100 kali, maka tidak ada orang yang membawa amalan lebih baik darinya pada hari kiamat kecuali orang yang mengamalkan semisalnya atau lebih, dan diampuni dosanya meski seperti buih lautan.",
    source: "HR. Muslim (IV/2071 no. 2691, 2692), Shahih At-Targhib wat Tarhib (1/413 no. 653) dari Abu Hurairah radhiyallahu 'anhu"
  },
  {
    id: "istighfar-100",
    order: 20,
    title: "Istighfar & Taubat Harian (100x)",
    badge: "100x Pensucian Hati",
    timeType: "both",
    count: 100,
    arabic: "أَسْتَغْفِرُ اللَّهَ وَأَتُوبُ إِلَيْهِ",
    latin: "Astaghfirullaaha wa atuubu ilayh.",
    translation: "Aku memohon ampunan kepada Allah dan bertaubat kepada-Nya.",
    benefits: "Rasulullah shallallahu 'alaihi wa sallam bersabda: 'Wahai manusia, bertaubatlah kepada Allah, sesungguhnya aku bertaubat kepada-Nya dalam sehari 100 kali.'",
    source: "HR. Al-Bukhari Fathul Bari (XI/101), Muslim no. 2702 (41, 42) dari Ibnu 'Umar dan Al-Agharr Al-Muzani radhiyallahu 'anhuma"
  }
];
