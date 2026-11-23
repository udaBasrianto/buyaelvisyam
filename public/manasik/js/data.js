/* eslint-disable */
/**
 * data.js — Kurikulum manasik umrah & haji (tamattu').
 *
 * Catatan fikih: urutan & penekanan mengikuti madzhab Syafi'i yang dipakai
 * mayoritas jamaah Indonesia. Perbedaan pendapat (mis. menutup wajah bagi
 * perempuan, jumlah kerikil) dijelaskan sebagai catatan, bukan dijadikan
 * jawaban "salah".
 */

/* ============================================================================
 * Teks Arab & doa
 * ========================================================================== */
export const TALBIYAH = {
  arabic:
    'لَبَّيْكَ اللَّهُمَّ لَبَّيْكَ، لَبَّيْكَ لَا شَرِيكَ لَكَ لَبَّيْكَ، إِنَّ الْحَمْدَ وَالنِّعْمَةَ لَكَ وَالْمُلْكَ، لَا شَرِيكَ لَكَ',
  latin:
    'Labbaika Allāhumma labbaika, labbaika lā syarīka laka labbaika, innal-ḥamda wan-ni‘mata laka wal-mulka, lā syarīka lak.',
  meaning:
    'Aku datang memenuhi panggilan-Mu, ya Allah. Tiada sekutu bagi-Mu. Sesungguhnya segala pujian, nikmat, dan kekuasaan adalah milik-Mu. Tiada sekutu bagi-Mu.'
};

export const DOA = {
  masukMasjid: {
    title: 'Doa masuk masjid',
    arabic:
      'اللَّهُمَّ افْتَحْ لِي أَبْوَابَ رَحْمَتِكَ',
    latin: 'Allāhummaftaḥ lī abwāba raḥmatik.',
    meaning: 'Ya Allah, bukakanlah untukku pintu-pintu rahmat-Mu.'
  },
  melihatKaabah: {
    title: 'Saat pertama melihat Ka\'bah',
    arabic:
      'اللَّهُمَّ زِدْ هَذَا الْبَيْتَ تَشْرِيفًا وَتَعْظِيمًا وَتَكْرِيمًا وَمَهَابَةً، وَزِدْ مَنْ حَجَّهُ أَوِ اعْتَمَرَهُ تَشْرِيفًا وَتَعْظِيمًا وَتَكْرِيمًا وَبِرًّا',
    latin:
      'Allāhumma zid hādzal-baita tasyrīfan wa ta‘ẓīman wa takrīman wa mahābah, wa zid man ḥajjahu awi‘tamarahu tasyrīfan wa ta‘ẓīman wa takrīman wa birrā.',
    meaning:
      'Ya Allah, tambahkanlah kemuliaan, keagungan, dan kewibawaan pada Baitullah ini; dan tambahkanlah kebaikan bagi orang yang berhaji dan berumrah ke sana.'
  },
  istilam: {
    title: 'Saat menghadap Hajar Aswad',
    arabic: 'بِسْمِ اللهِ وَاللهُ أَكْبَرُ',
    latin: 'Bismillāhi wallāhu akbar.',
    meaning: 'Dengan nama Allah, dan Allah Maha Besar.'
  },
  safa: {
    title: 'Doa di Bukit Safa',
    arabic:
      'اللهُ أَكْبَرُ، لَا إِلَهَ إِلَّا اللهُ وَحْدَهُ لَا شَرِيكَ لَهُ، لَهُ الْمُلْكُ وَلَهُ الْحَمْدُ وَهُوَ عَلَى كُلِّ شَيْءٍ قَدِيرٌ',
    latin:
      'Allāhu akbar. Lā ilāha illallāhu waḥdahu lā syarīka lah, lahul-mulku wa lahul-ḥamdu wa huwa ‘alā kulli syai\'in qadīr.',
    meaning:
      'Allah Maha Besar. Tiada tuhan selain Allah, Yang Maha Esa, tiada sekutu bagi-Nya. Milik-Nya kerajaan dan pujian, dan Dia Mahakuasa atas segala sesuatu.'
  },
  arafah: {
    title: 'Doa terbaik di hari Arafah',
    arabic:
      'لَا إِلَهَ إِلَّا اللهُ وَحْدَهُ لَا شَرِيكَ لَهُ، لَهُ الْمُلْكُ وَلَهُ الْحَمْدُ وَهُوَ عَلَى كُلِّ شَيْءٍ قَدِيرٌ',
    latin:
      'Lā ilāha illallāhu waḥdahu lā syarīka lah, lahul-mulku wa lahul-ḥamdu wa huwa ‘alā kulli syai\'in qadīr.',
    meaning:
      'Tiada tuhan selain Allah, Yang Maha Esa, tiada sekutu bagi-Nya. Milik-Nya kerajaan dan pujian, dan Dia Mahakuasa atas segala sesuatu.'
  },
  takbir: {
    title: 'Takbir hari raya / tasyrik',
    arabic:
      'اللهُ أَكْبَرُ، اللهُ أَكْبَرُ، لَا إِلَهَ إِلَّا اللهُ، وَاللهُ أَكْبَرُ، اللهُ أَكْبَرُ، وَلِلَّهِ الْحَمْدُ',
    latin:
      'Allāhu akbar, Allāhu akbar, lā ilāha illallāh, wallāhu akbar, Allāhu akbar, wa lillāhil-ḥamd.',
    meaning:
      'Allah Maha Besar, Allah Maha Besar, tiada tuhan selain Allah. Allah Maha Besar, Allah Maha Besar, dan segala pujian bagi Allah.'
  },
  sapuJagat: {
    title: 'Doa Sapu Jagat (Antara Rukun Yamani & Hajar Aswad)',
    arabic:
      'رَبَّنَا آتِنَا فِي الدُّنْيَا حَسَنَةً وَفِي الْآخِرَةِ حَسَنَةً وَقِنَا عَذَابَ النَّارِ',
    latin:
      'Rabbanā ātinā fid-dunyā ḥasanah wa fil-ākhirati ḥasanah wa qinā ‘adzāban-nār.',
    meaning:
      'Ya Tuhan kami, berilah kami kebaikan di dunia dan kebaikan di akhirat, dan lindungilah kami dari siksa neraka.',
    audioUrl: 'https://cdn.islamic.network/quran/audio/128/ar.alafasy/208.mp3'
  }
};

/* ============================================================================
 * Zona Doa Dinamis Selama Tawaf
 * ========================================================================== */
export const TAWAF_ZONES = [
  {
    id: 'aswad',
    name: 'Sudut Hajar Aswad',
    minFrac: 0.95,
    maxFrac: 0.08,
    action: 'Istilam: Angkat tangan kanan menghadap Hajar Aswad',
    arabic: 'بِسْمِ اللهِ وَاللهُ أَكْبَرُ',
    latin: 'Bismillāhi wallāhu akbar.',
    meaning: 'Dengan nama Allah, dan Allah Maha Besar.'
  },
  {
    id: 'iraqi',
    name: 'Menuju Rukun Iraqi & Hijr Ismail',
    minFrac: 0.08,
    maxFrac: 0.42,
    action: 'Berdzikir mengagungkan Allah di luar lingkaran Hijr Ismail',
    arabic: 'سُبْحَانَ اللهِ وَالْحَمْدُ لِلَّهِ وَلَا إِلَهَ إِلَّا اللهُ وَاللهُ أَكْبَرُ',
    latin: 'Subḥānallāhi wal-ḥamdu lillāhi wa lā ilāha illallāhu wallāhu akbar.',
    meaning: 'Maha Suci Allah, segala puji bagi Allah, tiada tuhan selain Allah, dan Allah Maha Besar.'
  },
  {
    id: 'syami',
    name: 'Rukun Syami (Sisi Barat)',
    minFrac: 0.42,
    maxFrac: 0.72,
    action: 'Memohon ampunan & keselamatan dunia akhirat',
    arabic: 'اللَّهُمَّ إِنِّي أَسْأَلُكَ الْعَفْوَ وَالْعَافِيَةَ فِي الدِّينِ وَالدُّنْيَا وَالْآخِرَةِ',
    latin: 'Allāhumma innī as-alukal-‘afwa wal-‘āfiyata fid-dīni wad-dunyā wal-ākhirah.',
    meaning: 'Ya Allah, sesungguhnya aku memohon ampunan dan keselamatan dalam urusan agama, dunia, dan akhirat.'
  },
  {
    id: 'yamani_aswad',
    name: 'Antara Rukun Yamani & Hajar Aswad',
    minFrac: 0.72,
    maxFrac: 0.95,
    action: 'Sunnah membaca Doa Sapu Jagat di sepanjang bentang ini',
    arabic: 'رَبَّنَا آتِنَا فِي الدُّنْيَا حَسَنَةً وَفِي الْآخِرَةِ حَسَنَةً وَقِنَا عَذَابَ النَّارِ',
    latin: 'Rabbanā ātinā fid-dunyā ḥasanah wa fil-ākhirati ḥasanah wa qinā ‘adzāban-nār.',
    meaning: 'Ya Tuhan kami, berilah kami kebaikan di dunia dan kebaikan di akhirat, dan lindungilah kami dari siksa neraka.',
    audioUrl: 'https://cdn.islamic.network/quran/audio/128/ar.alafasy/208.mp3'
  }
];

/* ============================================================================
 * Lokasi Jelajah 3D Bebas (Virtual Tour)
 * ========================================================================== */
export const TOUR_LOCATIONS = [
  {
    id: 'kaaba',
    title: "Ka'bah & Kiswah Suci",
    zone: 'haram',
    pos: [0, -32, 14],
    target: [0, 0, 7],
    fov: 46,
    badge: 'Kiblat Umat Islam',
    desc: 'Baitullah al-Haram, rumah ibadah pertama yang dibangun untuk manusia oleh Nabi Ibrahim AS dan Nabi Ismail AS. Dibalut Kiswah sutra hitam bertatahkan benang perak berlapis emas murni.',
    doa: {
      title: 'Doa Melihat Ka\'bah',
      arabic: 'اللَّهُمَّ زِدْ هَذَا الْبَيْتَ تَشْرِيفًا وَتَعْظِيمًا وَتَكْرِيمًا وَمَهَابَةً',
      latin: 'Allāhumma zid hādzal-baita tasyrīfan wa ta‘ẓīman wa takrīman wa mahābah.',
      meaning: 'Ya Allah, tambahkanlah kemuliaan, keagungan, kehormatan, dan kewibawaan pada rumah ini.'
    }
  },
  {
    id: 'hajar',
    title: 'Hajar Aswad',
    zone: 'haram',
    pos: [18, -18, 6.5],
    target: [6.3, -5.5, 2.5],
    fov: 40,
    badge: 'Batu dari Surga',
    desc: 'Terletak di sudut tenggara Ka\'bah setinggi 1,1 meter dari lantai. Merupakan titik awal dan akhir putaran tawaf. Disunnahkan mencium, mengusap, atau memberi isyarat istilam (melambaikan tangan kanan).',
    doa: {
      title: 'Ucapan Istilam',
      arabic: 'بِسْمِ اللهِ وَاللهُ أَكْبَرُ',
      latin: 'Bismillāhi wallāhu akbar.',
      meaning: 'Dengan nama Allah, dan Allah Maha Besar.'
    }
  },
  {
    id: 'hijr',
    title: 'Hijr Ismail (Al-Hatim)',
    zone: 'haram',
    pos: [0, 36, 11],
    target: [0, 10, 3],
    fov: 45,
    badge: 'Bagian Dalam Ka\'bah',
    desc: 'Area berbentuk setengah lingkaran berpagar marmer putih di sebelah utara Ka\'bah. Sekitar 3 meter di dalamnya dahulu termasuk bangunan asli Ka\'bah. Shalat di dalam Hijr Ismail bernilai sama dengan shalat di dalam Ka\'bah.',
    doa: {
      title: 'Dzikir di Hijr Ismail',
      arabic: 'اللَّهُمَّ أَنْتَ السَّلَامُ وَمِنْكَ السَّلَامُ تَبَارَكْتَ يَا ذَا الْجَلَالِ وَالْإِكْرَامِ',
      latin: 'Allāhumma antas-salām wa minkas-salām tabārakta yā dzal-jalāli wal-ikrām.',
      meaning: 'Ya Allah, Engkau adalah Maha Penyelamat dan dari-Mu lah keselamatan.'
    }
  },
  {
    id: 'maqam',
    title: 'Maqam Ibrahim',
    zone: 'haram',
    pos: [24, -4, 5.5],
    target: [10.5, 1.5, 3.2],
    fov: 40,
    badge: 'Jejak Kaki Nabi Ibrahim',
    desc: 'Bukan kuburan, melainkan batu tempat Nabi Ibrahim AS berdiri ketika menyusun batu-batu dinding Ka\'bah yang menjulang tinggi. Terlindung dalam sangkar kristal emas. Disunnahkan shalat 2 rakaat di belakangnya.',
    doa: {
      title: 'Ayat Maqam Ibrahim',
      arabic: 'وَاتَّخِذُوا مِنْ مَقَامِ إِبْرَاهِيمَ مُصَلًّى',
      latin: 'Wattakhidzū mim maqāmi Ibrāhīma muṣallā.',
      meaning: 'Dan jadikanlah sebagian maqam Ibrahim tempat shalat. (QS. Al-Baqarah: 125)'
    }
  },
  {
    id: 'safa',
    title: 'Bukit Safa (Masa\'a)',
    zone: 'haram',
    pos: [136, -88, 12],
    target: [131, -74, 5],
    fov: 50,
    badge: 'Awal Ibadah Sa\'i',
    desc: 'Bukit berbatu tempat memulai sa\'i. Dari bukit ini dahulu Ibunda Hajar memandang ke padang pasir mencari pertolongan dan air untuk putranya Ismail AS.',
    doa: {
      title: 'Doa di Puncak Safa',
      arabic: 'إِنَّ الصَّفَا وَالْمَرْوَةَ مِنْ شَعَائِرِ اللَّهِ، أَبْدَأُ بِمَا بَدَأَ اللَّهُ بِهِ',
      latin: 'Innaṣ-ṣafā wal-marwata min sya‘ā’irillāh, nabda-u bimā bada-allāhu bih.',
      meaning: 'Sesungguhnya Safa dan Marwah adalah sebagian dari syiar Allah. Kami memulai dengan apa yang Allah mulai.'
    }
  },
  {
    id: 'marwah',
    title: 'Bukit Marwah',
    zone: 'haram',
    pos: [102, 316, 12],
    target: [96, 298, 5],
    fov: 50,
    badge: 'Akhir Sa\'i & Tahallul',
    desc: 'Bukit tempat berakhirnya perjalanan sa\'i ke-7. Di titik inilah jamaah langsung menuntaskan umrahnya dengan memotong atau mencukur sebagian rambut (tahallul).',
    doa: {
      title: 'Doa Selesai Sa\'i',
      arabic: 'رَبَّنَا تَقَبَّلْ مِنَّا إِنَّكَ أَنْتَ السَّمِيعُ الْعَلِيمُ',
      latin: 'Rabbanā taqabbal minnā innaka antas-samī‘ul-‘alīm.',
      meaning: 'Ya Tuhan kami, terimalah amal dari kami, sesungguhnya Engkaulah Yang Maha Mendengar lagi Maha Mengetahui.'
    }
  },
  {
    id: 'mina',
    title: 'Lembah Mina',
    zone: 'mina',
    pos: [1060, -220, 110],
    target: [1080, 40, 20],
    fov: 48,
    badge: 'Hari Tarwiyah & Tasyrik',
    desc: 'Lembah dikelilingi perbukitan tandus yang kini dipenuhi ratusan ribu tenda putih tahan api. Tempat jamaah haji mabit pada 8 Dzulhijjah (Tarwiyah) serta 11, 12, dan 13 Dzulhijjah (Tasyrik).',
    doa: {
      title: 'Talbiyah di Mina',
      arabic: 'لَبَّيْكَ اللَّهُمَّ لَبَّيْكَ، لَبَّيْكَ لَا شَرِيكَ لَكَ لَبَّيْكَ',
      latin: 'Labbaika Allāhumma labbaika, labbaika lā syarīka laka labbaika.',
      meaning: 'Aku datang memenuhi panggilan-Mu ya Allah...'
    }
  },
  {
    id: 'jamarat',
    title: 'Jamarat (Tempat Melontar)',
    zone: 'mina',
    pos: [1080, -90, 42],
    target: [1080, 60, 16],
    fov: 46,
    badge: 'Simbol Melawan Godaan',
    desc: 'Kompleks jembatan bertingkat dengan tiga pilar raksasa: Jamrat al-Sughra, Jamrat al-Wustha, dan Jamrat al-Aqabah. Tempat melontar batu kerikil meneladani Nabi Ibrahim AS mengusir iblis.',
    doa: {
      title: 'Takbir Saat Melontar',
      arabic: 'بِسْمِ اللهِ وَاللهُ أَكْبَرُ رَغْمًا لِلشَّيْطَانِ وَرِضًا لِلرَّحْمَنِ',
      latin: 'Bismillāhi wallāhu akbar, raghman lisy-syaithān wa ridhan lir-raḥmān.',
      meaning: 'Dengan nama Allah, dan Allah Maha Besar, untuk menghinakan setan dan mengharap ridha Ar-Rahman.'
    }
  },
  {
    id: 'muzdalifah',
    title: 'Muzdalifah (Masy\'aril Haram)',
    zone: 'muzdalifah',
    pos: [1760, -160, 85],
    target: [1800, 50, 15],
    fov: 45,
    badge: 'Mabit di Bawah Langit',
    desc: 'Terletak di antara Arafah dan Mina. Jamaah singgah setelah matahari terbenam pada hari Arafah (9 Dzulhijjah) untuk shalat Maghrib-Isya jamak qashar, bermalam (mabit) di tempat terbuka, dan mengumpulkan kerikil jamarat.',
    doa: {
      title: 'Dzikir di Masy\'aril Haram',
      arabic: 'فَإِذَا أَفَضْتُمْ مِنْ عَرَفَاتٍ فَاذْكُرُوا اللَّهَ عِنْدَ الْمَشْعَرِ الْحَرَامِ',
      latin: 'Fa-idza afadhtum min ‘arafātin fadzkurullāha ‘indal-masy‘aril-ḥarām.',
      meaning: 'Maka apabila kamu telah bertolak dari Arafah, berdzikirlah kepada Allah di Masy\'aril Haram. (QS. Al-Baqarah: 198)'
    }
  },
  {
    id: 'arafah',
    title: 'Padang Arafah & Jabal Rahmah',
    zone: 'arafah',
    pos: [2460, -220, 150],
    target: [2500, 120, 25],
    fov: 48,
    badge: 'Al-Hajju Arafah (Inti Haji)',
    desc: 'Padang luas tempat berlangsungnya wukuf pada 9 Dzulhijjah dari tergelincir matahari hingga maghrib. Di bukit berbatu Jabal Rahmah inilah Nabi Ibrahim AS dan Nabi Muhammad ﷺ menyampaikan khutbah wada\'.',
    doa: {
      title: 'Sebaik-baik Doa Hari Arafah',
      arabic: 'لَا إِلَهَ إِلَّا اللهُ وَحْدَهُ لَا شَرِيكَ لَهُ، لَهُ الْمُلْكُ وَلَهُ الْحَمْدُ وَهُوَ عَلَى كُلِّ شَيْءٍ قَدِيرٌ',
      latin: 'Lā ilāha illallāhu waḥdahu lā syarīka lah, lahul-mulku wa lahul-ḥamdu wa huwa ‘alā kulli syai\'in qadīr.',
      meaning: 'Tiada tuhan selain Allah, Yang Maha Esa, tiada sekutu bagi-Nya. Milik-Nya kerajaan dan pujian, dan Dia Mahakuasa atas segala sesuatu.'
    }
  }
];

/* ============================================================================
 * Informasi mode
 * ========================================================================== */
export const MODE_INFO = {
  umrah: {
    id: 'umrah',
    label: 'Umrah',
    tagline: 'Ihram → Tawaf → Sa\'i → Tahallul',
    description:
      'Simulasi umrah lengkap: berihram di miqat, tawaf 7 putaran dari Hajar Aswad, shalat di Maqam Ibrahim, sa\'i 7 kali dari Safa ke Marwah, lalu bertahalul.',
    duration: '± 3 jam waktu nyata',
    steps: 11
  },
  hajj: {
    id: 'hajj',
    label: 'Haji',
    tagline: 'Tamattu\' • Qiran • Ifrad — Mina → Arafah → Muzdalifah → Jamarat',
    description:
      'Tiga jenis manasik haji: Tamattu\' (paling utama), Qiran, dan Ifrad — lengkap dengan tawaf qudum, hadyu, tawaf ifadah, sa\'i, dan tawaf wada\'.',
    duration: '5–7 hari (disimulasikan)',
    steps: 19
  },
  tour: {
    id: 'tour',
    label: 'Jelajah 3D Bebas',
    tagline: 'Eksplorasi Bebas • Masjidil Haram, Mina, Muzdalifah & Arafah',
    description:
      'Mode tur interaktif tanpa urutan langkah: terbang bebas ke Ka\'bah, Hijr Ismail, Maqam Ibrahim, Safa-Marwah, Jamarat, hingga Jabal Rahmah untuk mendalami sejarah dan doa.',
    duration: 'Bebas sesuai kebutuhan',
    steps: 10
  }
};

/* ============================================================================
 * UMRAH
 * ========================================================================== */
const UMRAH_STEPS = [
  {
    id: 'ihram',
    phase: 'Ihram',
    title: 'Berihram di Miqat',
    subtitle: 'Niat, talbiyah, dan niat meninggalkan larangan',
    zone: 'haram',
    view: 'miqat',
    time: { day: 1, hour: 8.5, label: 'Miqat' },
    kind: 'info',
    body: [
      'Anda tiba di miqat (untuk jamaah dari Indonesia biasanya <b>Yalamlam</b> atau <b>Qarn al-Manazil</b>; bila lewat Madinah maka <b>Dzul Hulaifah / Bir Ali</b>). Sebelum niat: mandi, memakai wangi-wangian pada badan (bukan pada kain ihram), lalu bagi laki-laki memakai izar dan rida tanpa jahitan.',
      'Shalat dua rakaat, lalu berniat umrah: <i>“Labbaika ‘umratan”</i> — aku datang memenuhi panggilan-Mu dengan umrah. Sejak niat itu, seluruh larangan ihram berlaku sampai tahallul.'
    ],
    talbiyah: true,
    dalil: {
      arabic: 'وَأَتِمُّوا الْحَجَّ وَالْعُمْرَةَ لِلَّهِ',
      latin: 'Wa atimmul-ḥajja wal-‘umrata lillāh.',
      meaning: 'Dan sempurnakanlah haji dan umrah karena Allah.',
      source: 'QS. Al-Baqarah: 196'
    },
    tip: 'Sunah: mandi sebelum ihram, memakai wangi-wangian di badan sebelum niat, dan memperbanyak talbiyah sepanjang perjalanan.',
    checklist: 'Ihram umrah & talbiyah'
  },
  {
    id: 'larangan',
    phase: 'Ihram',
    title: 'Larangan Selama Ihram',
    subtitle: 'Satu kesalahan saja bisa berbuah fidyah',
    zone: 'haram',
    view: 'miqat',
    kind: 'quiz',
    body: [
      'Selama ihram ada larangan yang harus dijaga. Yang paling berat: berhubungan suami-istri (membatalkan), berburu binatang darat, dan bertengkar (rafats, fusuq, jidal).',
      'Pilih satu perbuatan yang <b>masih boleh</b> dilakukan saat ihram.'
    ],
    quiz: {
      question: 'Manakah yang masih BOLEH dilakukan saat berihram?',
      options: [
        { text: 'Memakai sandal dan cincin', ok: true, feedback: 'Benar. Sandal terbuka dan cincin bukan pakaian berjahit yang dilarang.' },
        { text: 'Memotong kuku jari', ok: false, feedback: 'Salah. Memotong kuku termasuk larangan ihram; jika dilakukan wajib fidyah.' },
        { text: 'Memakai minyak wangi', ok: false, feedback: 'Salah. Wangi-wangian pada badan atau kain ihram dilarang setelah niat.' },
        { text: 'Mencukur rambut kepala', ok: false, feedback: 'Salah. Mencukur rambut baru boleh setelah tahallul.' }
      ],
      explain:
        'Larangan ihram meliputi: memotong rambut/kuku, memakai wangi-wangian, menikah atau berhubungan intim, berburu, memotong tanaman haram, serta bagi laki-laki memakai pakaian berjahit dan menutup kepala. Bagi perempuan: tidak memakai niqab dan sarung tangan (menurut jumhur).'
    },
    checklist: 'Memahami larangan ihram'
  },
  {
    id: 'masuk',
    phase: 'Menuju Haram',
    title: 'Masuk Masjidil Haram',
    subtitle: 'Adab masuk dan doa',
    zone: 'haram',
    view: 'gate',
    time: { day: 1, hour: 7.0, label: 'Bab as-Salam' },
    kind: 'info',
    body: [
      'Masuklah dengan kaki kanan, membaca doa masuk masjid, dan berjalan dengan tenang. Jangan berhenti di pintu: arus jamaah sangat padat, terutama menjelang shalat.',
      'Bila memungkinkan, lakukan shalat tahiyatul masjid, lalu bergerak menuju mataf.'
    ],
    doa: 'masukMasjid',
    tip: 'Simpan sandal di tas atau rak. Di musim ramai, jangan membawa barang berharga berlebihan.',
    checklist: 'Masuk Masjidil Haram'
  },
  {
    id: 'melihat-kaabah',
    phase: 'Menuju Haram',
    title: 'Pandangan Pertama ke Ka\'bah',
    subtitle: 'Waktu doa yang sangat mustajab',
    zone: 'haram',
    view: 'kaaba',
    time: { day: 1, hour: 7.2, label: 'Mataf' },
    kind: 'info',
    body: [
      'Saat Ka\'bah pertama kali terlihat, angkat tangan dan berdoalah. Inilah salah satu tempat doa yang dijanjikan dikabulkan.',
      'Jangan mendorong atau berhenti di tengah arus. Cari posisi di sisi luar mataf, lalu bergerak menuju garis sejajar Hajar Aswad.'
    ],
    doa: 'melihatKaabah',
    tip: 'Banyak jamaah lupa bahwa doa pertama melihat Ka\'bah adalah momen singkat — siapkan hajat yang ingin didoakan.',
    checklist: 'Doa pertama melihat Ka\'bah'
  },
  {
    id: 'tawaf-mulai',
    phase: 'Tawaf',
    title: 'Titik Mulai Tawaf',
    subtitle: 'Hajar Aswad, bukan pintu Ka\'bah',
    zone: 'haram',
    view: 'kaaba',
    kind: 'quiz',
    body: [
      'Tawaf dimulai dari garis lurus dengan <b>Hajar Aswad</b> di sudut tenggara Ka\'bah, dengan Ka\'bah selalu di sisi kiri. Arah putaran: berlawanan arah jarum jam.',
      'Sebelum mulai, menghadaplah ke Hajar Aswad, angkat tangan, dan bertakbir. Bila memungkinkan, sentuh atau cium; bila tidak, cukup isyarat dari jauh dan jangan memaksakan diri menembus kerumunan.'
    ],
    quiz: {
      question: 'Dari manakah tawaf dimulai?',
      options: [
        { text: 'Garis sejajar Hajar Aswad, Ka\'bah di sisi kiri', ok: true, feedback: 'Benar. Ini sunnah Nabi ﷺ dan menjadi patokan hitungan putaran.' },
        { text: 'Pintu Ka\'bah', ok: false, feedback: 'Salah. Pintu Ka\'bah bukan titik mulai tawaf.' },
        { text: 'Maqam Ibrahim', ok: false, feedback: 'Salah. Maqam Ibrahim adalah tempat shalat setelah tawaf.' },
        { text: 'Hijr Ismail', ok: false, feedback: 'Salah. Hijr Ismail dilewati, bukan titik mulai.' }
      ],
      explain:
        'Nabi ﷺ memulai tawaf dari Hajar Aswad. Hitungan 7 putaran dihitung dari garis itu sampai kembali ke garis yang sama.'
    },
    checklist: 'Mengetahui titik mulai tawaf'
  },
  {
    id: 'tawaf',
    phase: 'Tawaf',
    title: 'Tawaf 7 Putaran',
    subtitle: 'Ka\'bah selalu di sisi kiri • idtiba\' & raml bagi laki-laki',
    zone: 'haram',
    view: 'kaaba',
    kind: 'tawaf',
    tawaf: { laps: 7, ramlLaps: 3 },
    body: [
      'Lakukan 7 putaran mengelilingi Ka\'bah. Setiap kali melewati Hajar Aswad, ucapkan takbir dan isyarat. Tidak ada doa wajib tertentu — berdoalah dengan bahasa Anda sendiri.',
      'Sunah bagi laki-laki: <b>idtiba\'</b> (pundak kanan terbuka, kain di bawah ketiak kiri) dan <b>raml</b> (jalan cepat) pada 3 putaran pertama, bila tidak mengganggu jamaah lain.'
    ],
    dalil: {
      arabic: 'وَلْيَطَّوَّفُوا بِالْبَيْتِ الْعَتِيقِ',
      latin: 'Wal yaṭṭawwafū bil-baitil-‘atīq.',
      meaning: 'Dan hendaklah mereka bertawaf mengelilingi Baitullah yang tua itu.',
      source: 'QS. Al-Hajj: 29'
    },
    tip: 'Jangan berhenti di dinding Ka\'bah atau mencium setiap sudut — itu tidak disyariatkan dan menyulitkan arus.',
    checklist: 'Tawaf 7 putaran'
  },
  {
    id: 'maqam',
    phase: 'Setelah Tawaf',
    title: 'Shalat di Maqam Ibrahim & Zamzam',
    subtitle: '2 rakaat, lalu minum air zamzam',
    zone: 'haram',
    view: 'kaaba',
    kind: 'quiz',
    body: [
      'Setelah 7 putaran, shalat 2 rakaat di belakang Maqam Ibrahim bila memungkinkan — bila penuh, boleh di tempat lain di dalam masjid. Sunah membaca <i>Al-Kafirun</i> pada rakaat pertama dan <i>Al-Ikhlas</i> pada rakaat kedua.',
      'Setelah itu minum air zamzam, lalu kembali ke Hajar Aswad untuk memulai sa\'i.'
    ],
    quiz: {
      question: 'Apa yang disunahkan setelah menyelesaikan 7 putaran tawaf?',
      options: [
        { text: 'Shalat 2 rakaat di belakang Maqam Ibrahim', ok: true, feedback: 'Benar, lalu minum zamzam dan menuju Safa untuk sa\'i.' },
        { text: 'Langsung bertahalul', ok: false, feedback: 'Salah. Tahallul dilakukan setelah sa\'i.' },
        { text: 'Mencium Hajar Aswad lalu keluar masjid', ok: false, feedback: 'Salah. Sa\'i belum dilakukan.' },
        { text: 'Tawaf lagi 7 putaran', ok: false, feedback: 'Salah. Tawaf cukup 7 putaran.' }
      ],
      explain:
        'Dasarnya QS. Al-Baqarah: 125, “Dan jadikanlah Maqam Ibrahim sebagai tempat shalat.”'
    },
    checklist: 'Shalat 2 rakaat di Maqam Ibrahim'
  },
  {
    id: 'sai-mulai',
    phase: 'Sa\'i',
    title: 'Awal Sa\'i: Bukit Safa',
    subtitle: 'Safa dulu, bukan Marwah',
    zone: 'haram',
    view: 'masaa',
    kind: 'quiz',
    body: [
      'Sa\'i dimulai dari <b>Bukit Safa</b>. Naiklah (bila memungkinkan), menghadap Ka\'bah, bertakbir, dan berdoa. Dari Safa menuju Marwah dihitung <b>satu</b> perjalanan.',
      'Total 7 perjalanan: Safa→Marwah (1), Marwah→Safa (2), dan seterusnya, berakhir di <b>Marwah</b> pada perjalanan ke-7.'
    ],
    quiz: {
      question: 'Sa\'i dimulai dari bukit mana?',
      options: [
        { text: 'Safa', ok: true, feedback: 'Benar. Berakhir di Marwah pada perjalanan ke-7.' },
        { text: 'Marwah', ok: false, feedback: 'Salah. Marwah adalah akhir, bukan awal.' },
        { text: 'Bebas, dari mana saja', ok: false, feedback: 'Salah. Urutan Safa→Marwah adalah syarat hitungan.' },
        { text: 'Dari Maqam Ibrahim', ok: false, feedback: 'Salah. Maqam Ibrahim bukan bagian dari sa\'i.' }
      ],
      explain:
        'Dalil: QS. Al-Baqarah: 158 — “Sesungguhnya Safa dan Marwah adalah sebagian dari syiar Allah.” Nabi ﷺ memulai sa\'i dari Safa.'
    },
    checklist: 'Mengetahui awal sa\'i'
  },
  {
    id: 'sai',
    phase: 'Sa\'i',
    title: 'Sa\'i 7 Perjalanan',
    subtitle: 'Berlari kecil di antara dua lampu hijau',
    zone: 'haram',
    view: 'masaa',
    kind: 'sai',
    sai: { legs: 7 },
    body: [
      'Berjalanlah antara Safa dan Marwah sebanyak 7 kali. Di area antara dua tanda hijau, laki-laki disunahkan berlari kecil; perempuan berjalan biasa.',
      'Tidak ada doa khusus yang wajib — perbanyak dzikir dan doa sepanjang perjalanan.'
    ],
    dalil: {
      arabic: 'إِنَّ الصَّفَا وَالْمَرْوَةَ مِنْ شَعَائِرِ اللهِ',
      latin: 'Innaṣ-ṣafā wal-marwata min sya‘ā\'irillāh.',
      meaning: 'Sesungguhnya Safa dan Marwah adalah sebagian dari syiar-syiar Allah.',
      source: 'QS. Al-Baqarah: 158'
    },
    tip: 'Di musim padat, jangan berhenti di tengah koridor. Ikuti arus satu arah dan jaga langkah.',
    checklist: 'Sa\'i 7 perjalanan'
  },
  {
    id: 'tahallul',
    phase: 'Tahallul',
    title: 'Tahallul: Cukur atau Potong',
    subtitle: 'Selesainya umrah',
    zone: 'haram',
    view: 'kaaba',
    kind: 'halq',
    body: [
      'Setelah sa\'i selesai, bertahalullah. Bagi laki-laki: <b>halq</b> (cukur habis) lebih utama, atau <b>taqsir</b> (memotong sebagian). Bagi perempuan: cukup memotong sepanjang ujung jari (taqsir).',
      'Dengan tahallul, seluruh larangan ihram berakhir dan umrah Anda selesai.'
    ],
    dalil: {
      arabic: 'مُحَلِّقِينَ رُءُوسَكُمْ وَمُقَصِّرِينَ',
      latin: 'Muḥalliqīna ru\'ūsakum wa muqaṣṣirīn.',
      meaning: 'Dengan mencukur rambut kepala atau memotongnya.',
      source: 'QS. Al-Fath: 27'
    },
    checklist: 'Tahallul'
  },
  {
    id: 'selesai',
    phase: 'Selesai',
    title: 'Umrah Selesai',
    subtitle: 'Alhamdulillah',
    zone: 'haram',
    view: 'kaaba',
    kind: 'finish',
    body: [
      'Umrah Anda sah dengan urutan: ihram → tawaf → sa\'i → tahallul. Setelah ini Anda halal dari ihram.',
      'Bila berniat haji tamattu\', Anda akan berihram lagi pada 8 Dzulhijjah dari Makkah.'
    ],
    checklist: 'Umrah selesai'
  }
];

/* ============================================================================
 * HAJI TAMATTU'
 * ========================================================================== */
const HAJJ_STEPS = [
  {
    id: 'hajj-ihram',
    phase: 'Ihram Haji',
    title: 'Berihram untuk Haji',
    subtitle: '8 Dzulhijjah • dari Makkah',
    zone: 'haram',
    view: 'kaaba',
    time: { day: 8, hour: 6.6, label: '8 Dzulhijjah • Makkah' },
    kind: 'info',
    body: [
      'Jamaah tamattu\' sudah bertahalul setelah umrah. Kini, pada 8 Dzulhijjah (hari Tarwiyah), mandi, memakai ihram, shalat dua rakaat, lalu berniat haji: <i>“Labbaika ḥajjan”</i>.',
      'Karena Anda berada di Makkah, miqat haji adalah Makkah itu sendiri — tidak perlu keluar ke miqat lain.'
    ],
    talbiyah: true,
    dalil: {
      arabic: 'وَأَتِمُّوا الْحَجَّ وَالْعُمْرَةَ لِلَّهِ',
      latin: 'Wa atimmul-ḥajja wal-‘umrata lillāh.',
      meaning: 'Dan sempurnakanlah haji dan umrah karena Allah.',
      source: 'QS. Al-Baqarah: 196'
    },
    tip: 'Niat haji tidak menghapus umrah yang sudah selesai. Bila belum, jalankan mode Umrah lebih dahulu — mode ini fokus pada rangkaian haji. Ihram haji berlaku sampai tahallul pada 10 Dzulhijjah.',
    checklist: 'Ihram haji & talbiyah'
  },
  {
    id: 'mina-8',
    phase: 'Mina',
    title: 'Mabit di Mina (Malam 8)',
    subtitle: 'Shalat qashar, tanpa jamak menurut sunnah',
    zone: 'mina',
    view: 'mina',
    time: { day: 8, hour: 11.0, label: '8 Dzulhijjah • Mina' },
    kind: 'mabit',
    mabit: { untilDay: 9, untilHour: 5.5, title: 'Mabit di Mina' },
    body: [
      'Berangkat ke Mina pada 8 Dzulhijjah. Di Mina, shalat Dzuhur, Ashar, Maghrib, Isya, dan Subuh dikerjakan pada waktunya dengan <b>qashar</b> (shalat 4 rakaat menjadi 2), tanpa dijamak — ini yang paling sesuai sunnah Nabi ﷺ, meski sebagian jamaah menjamak karena kondisi.',
      'Mabit di Mina pada malam 8 ini hukumnya sunnah. Manfaatkan waktu untuk istirahat, dzikir, dan membaca talbiyah.'
    ],
    dalil: {
      arabic: 'خُذُوا عَنِّي مَنَاسِكَكُمْ',
      latin: 'Khudzū ‘annī manāsikakum.',
      meaning: 'Ambillah dariku tata cara manasik kalian.',
      source: 'HR. Muslim'
    },
    tip: 'Jaga barang bawaan dan hafalkan nomor tenda. Malam ini adalah kesempatan tidur cukup sebelum puncak haji.',
    checklist: 'Mabit di Mina malam 8'
  },
  {
    id: 'arafah',
    phase: 'Arafah',
    title: 'Wukuf di Arafah',
    subtitle: '9 Dzulhijjah • inti ibadah haji',
    zone: 'arafah',
    view: 'arafah',
    time: { day: 9, hour: 11.0, label: '9 Dzulhijjah • Arafah' },
    kind: 'wukuf',
    wukuf: { startHour: 12.17, endHour: 18.35 },
    body: [
      'Setelah terbit matahari 9 Dzulhijjah, bergeraklah ke Arafah. Wukuf dimulai setelah <b>zawal</b> (matahari tergelincir) dan berlangsung sampai <b>maghrib</b>.',
      'Inilah rukun haji yang tidak bisa diganti: siapa yang tidak wukuf di Arafah, tidak ada haji baginya. Perbanyak doa, dzikir, istighfar, dan talbiyah dengan menghadap kiblat serta mengangkat tangan.'
    ],
    dalil: {
      arabic: 'الْحَجُّ عَرَفَةُ',
      latin: 'Al-ḥajju ‘Arafah.',
      meaning: 'Haji itu (wukuf) Arafah.',
      source: 'HR. Tirmidzi'
    },
    tip: 'Shalat Dzuhur dan Ashar dijamak-qashar pada waktu Dzuhur. Setelah itu tetaplah di Arafah sampai matahari terbenam — jangan pulang lebih awal.',
    checklist: 'Wukuf di Arafah'
  },
  {
    id: 'muzdalifah',
    phase: 'Muzdalifah',
    title: 'Mabit di Muzdalifah',
    subtitle: 'Malam 10 • kumpulkan kerikil',
    zone: 'muzdalifah',
    view: 'muzdalifah',
    time: { day: 9, hour: 19.2, label: '9 Dzulhijjah • Muzdalifah' },
    kind: 'pebbles',
    pebbles: { take: 7 },
    body: [
      'Setelah matahari terbenam di Arafah, berangkat ke Muzdalifah tanpa shalat Maghrib di jalan. Setibanya, shalat Maghrib dan Isya dijamak-qashar.',
      'Mabit di Muzdalifah hukumnya wajib. Ambillah <b>7 kerikil</b> untuk Jamrat Aqabah besok pagi; sisanya boleh diambil di Mina. Tidurlah sampai Subuh, lalu shalat Subuh di Masy\'ar al-Haram.'
    ],
    dalil: {
      arabic: 'فَاذْكُرُوا اللهَ عِنْدَ الْمَشْعَرِ الْحَرَامِ',
      latin: 'Fadzkurullāha ‘indal-masy‘aril-ḥarām.',
      meaning: 'Maka berdzikirlah kepada Allah di Masy\'ar al-Haram (Muzdalifah).',
      source: 'QS. Al-Baqarah: 198'
    },
    tip: 'Jangan memaksakan berjalan kaki bila jarak berat. Banyak jamaah mengambil kerikil lebih awal, tetapi 7 butir untuk Aqabah adalah yang paling utama.',
    checklist: 'Mabit di Muzdalifah & ambil kerikil'
  },
  {
    id: 'aqabah',
    phase: '10 Dzulhijjah',
    title: 'Melontar Jamrat Aqabah',
    subtitle: '7 kerikil • takbir setiap lemparan',
    zone: 'mina',
    view: 'jamarat',
    time: { day: 10, hour: 8.2, label: '10 Dzulhijjah • Jamarat' },
    kind: 'ramy',
    ramy: { targets: ['aqabah'], pebbles: 7, order: false, afterZawal: false },
    body: [
      'Pada pagi 10 Dzulhijjah, melontarlah <b>Jamrat Aqabah</b> (Kubra) dengan 7 kerikil, satu per satu, sambil bertakbir pada setiap lemparan.',
      'Mulai lemparan pertama, hentikan talbiyah. Jangan melontar dengan sandal, sepatu, atau benda besar — cukup kerikil sebesar biji kacang.'
    ],
    dalil: {
      arabic: 'وَاذْكُرُوا اللهَ فِي أَيَّامٍ مَعْلُومَاتٍ',
      latin: 'Wadzkurullāha fī ayyāmin ma‘lūmāt.',
      meaning: 'Dan berdzikirlah kepada Allah pada hari-hari yang telah ditentukan.',
      source: 'QS. Al-Hajj: 28'
    },
    tip: 'Jangan mendorong. Bila padat, tunggu gelombang berikutnya; melontar boleh sampai malam 10 bagi yang menghindari kepadatan (menurut sebagian ulama).',
    checklist: 'Melontar Jamrat Aqabah'
  },
  {
    id: 'qurban',
    phase: '10 Dzulhijjah',
    title: 'Hadyu / Qurban Tamattu\'',
    subtitle: 'Wajib bagi haji tamattu\'',
    zone: 'mina',
    view: 'mina',
    time: { day: 10, hour: 8.0, label: '10 Dzulhijjah • Mina' },
    kind: 'quiz',
    body: [
      'Karena Anda haji tamattu\', Anda wajib menyembelih <b>hadyu</b> (seekor kambing, atau sepertujuh sapi). Bila tidak mampu, berpuasa 3 hari di tanah suci dan 7 hari setelah pulang.',
      'Daging qurban dibagikan kepada fakir miskin di tanah haram. Anda tidak harus menyembelih sendiri; bisa diwakilkan melalui lembaga resmi.'
    ],
    dalil: {
      arabic: 'فَمَنْ تَمَتَّعَ بِالْعُمْرَةِ إِلَى الْحَجِّ فَمَا اسْتَيْسَرَ مِنَ الْهَدْيِ',
      latin: 'Faman tamatta‘a bil-‘umrati ilal-ḥajji famā istaysara minal-hady.',
      meaning: 'Barangsiapa berhaji tamattu\', maka (wajib) hadyu yang mudah diperoleh.',
      source: 'QS. Al-Baqarah: 196'
    },
    quiz: {
      question: 'Apa konsekuensi bila hadyu tamattu\' ditinggalkan padahal mampu?',
      options: [
        { text: 'Wajib dam (menyembelih) dan haji tetap sah', ok: true, feedback: 'Benar. Hadyu adalah wajib haji; meninggalkannya ditutup dengan dam.' },
        { text: 'Hajinya batal dan harus diulang', ok: false, feedback: 'Salah. Hadyu termasuk wajib, bukan rukun, sehingga tidak membatalkan haji.' },
        { text: 'Tidak ada konsekuensi apa pun', ok: false, feedback: 'Salah. Wajib yang ditinggalkan harus ditutup dengan dam.' },
        { text: 'Harus berpuasa 10 hari saja', ok: false, feedback: 'Salah. Puasa 10 hari adalah alternatif bila tidak mampu menyembelih, bukan pengganti ketika mampu.' }
      ],
      explain: 'Rukun haji tidak bisa diganti dam; wajib haji bisa ditutup dengan dam. Hadyu tamattu\' termasuk wajib.'
    },
    checklist: 'Hadyu / qurban tamattu\''
  },
  {
    id: 'halq-10',
    phase: '10 Dzulhijjah',
    title: 'Tahallul Pertama',
    subtitle: 'Cukur atau potong rambut',
    zone: 'mina',
    view: 'mina',
    time: { day: 10, hour: 8.4, label: '10 Dzulhijjah • Mina' },
    kind: 'halq',
    body: [
      'Setelah melontar (dan hadyu bagi tamattu\'/qiran), bertahalullah: cukur habis bagi laki-laki atau potong sebagian; perempuan cukup memotong ujung rambut.',
      'Dengan tahallul ini, larangan ihram gugur kecuali berhubungan suami-istri, yang baru halal setelah tawaf ifadah.'
    ],
    dalil: {
      arabic: 'فَمَنْ كَانَ مِنْكُمْ مَرِيضًا أَوْ بِهِ أَذًى مِنْ رَأْسِهِ فَفِدْيَةٌ مِنْ صِيَامٍ أَوْ صَدَقَةٍ أَوْ نُسُكٍ',
      latin: 'Faman kāna minkum marīḍan aw bihī adzan min ra\'sihī fafidyatun min ṣiyāmin aw ṣadaqatin aw nusuk.',
      meaning: 'Barangsiapa sakit atau ada gangguan di kepalanya, maka wajib fidyah: puasa, sedekah, atau sembelihan.',
      source: 'QS. Al-Baqarah: 196'
    },
    checklist: 'Tahallul pertama'
  },
  {
    id: 'ifadah',
    phase: '10 Dzulhijjah',
    title: 'Tawaf Ifadah',
    subtitle: 'Rukun haji • 7 putaran',
    zone: 'haram',
    view: 'kaaba',
    time: { day: 10, hour: 10.0, label: '10 Dzulhijjah • Masjidil Haram' },
    kind: 'tawaf',
    tawaf: { laps: 7, ramlLaps: 0, ifadah: true },
    body: [
      'Tawaf ifadah adalah <b>rukun haji</b> — tidak bisa diganti dam. Lakukan 7 putaran mengelilingi Ka\'bah.',
      'Bagi haji tamattu\', sa\'i sudah dikerjakan saat umrah, sehingga tawaf ifadah tidak perlu diulang sa\'i. Bagi haji ifrad/qiran, sa\'i dikerjakan setelah tawaf ini.'
    ],
    dalil: {
      arabic: 'وَلْيَطَّوَّفُوا بِالْبَيْتِ الْعَتِيقِ',
      latin: 'Wal yaṭṭawwafū bil-baitil-‘atīq.',
      meaning: 'Dan hendaklah mereka bertawaf mengelilingi Baitullah yang tua itu.',
      source: 'QS. Al-Hajj: 29'
    },
    tip: 'Setelah tawaf ifadah, berhubungan suami-istri kembali halal. Jangan lupa shalat 2 rakaat di Maqam Ibrahim bila lapang.',
    checklist: 'Tawaf ifadah'
  },
  {
    id: 'mina-10',
    phase: 'Mina',
    title: 'Kembali ke Mina',
    subtitle: 'Mabit malam 10',
    zone: 'mina',
    view: 'mina',
    time: { day: 10, hour: 14.0, label: '10 Dzulhijjah • Mina' },
    kind: 'mabit',
    mabit: { untilDay: 11, untilHour: 5.5, title: 'Mabit di Mina (malam 10)' },
    body: [
      'Setelah tawaf ifadah, kembali ke Mina untuk mabit. Mabit di Mina pada malam-malam tasyrik (10, 11, 12) hukumnya wajib.',
      'Istirahatlah, karena besok Anda akan melontar tiga jumrah.'
    ],
    tip: 'Mabit di Mina wajib; bila meninggalkannya tanpa uzur, wajib dam.',
    checklist: 'Mabit Mina malam 10'
  },
  {
    id: 'ramy-11',
    phase: 'Hari Tasyrik',
    title: 'Melontar 3 Jumrah (11 Dzulhijjah)',
    subtitle: 'Sughra → Wustha → Aqabah • 21 kerikil',
    zone: 'mina',
    view: 'jamarat',
    time: { day: 11, hour: 11.8, label: '11 Dzulhijjah • Jamarat' },
    kind: 'ramy',
    ramy: { targets: ['sughra', 'wustha', 'aqabah'], pebbles: 7, order: true, afterZawal: true },
    body: [
      'Pada 11 Dzulhijjah, lontar tiga jumrah secara berurutan: <b>Sughra (Ula)</b>, lalu <b>Wustha</b>, lalu <b>Aqabah</b> — masing-masing 7 kerikil.',
      'Waktunya setelah zawal (matahari tergelincir). Berhenti berdoa sejenak setelah Sughra dan Wustha adalah sunnah; Aqabah tidak diikuti doa di tempat.'
    ],
    dalil: {
      arabic: 'وَاذْكُرُوا اللهَ فِي أَيَّامٍ مَعْلُومَاتٍ',
      latin: 'Wadzkurullāha fī ayyāmin ma‘lūmāt.',
      meaning: 'Dan berdzikirlah kepada Allah pada hari-hari yang telah ditentukan.',
      source: 'QS. Al-Hajj: 28'
    },
    tip: 'Jangan melontar sebelum zawal pada hari tasyrik. Jika terlanjur, ulangi setelah zawal.',
    checklist: 'Ramy 11 Dzulhijjah (3 jumrah)'
  },
  {
    id: 'mina-11',
    phase: 'Hari Tasyrik',
    title: 'Mabit di Mina (Malam 11)',
    subtitle: 'Bersiap untuk hari terakhir',
    zone: 'mina',
    view: 'mina',
    time: { day: 11, hour: 15.0, label: '11 Dzulhijjah • Mina' },
    kind: 'mabit',
    mabit: { untilDay: 12, untilHour: 5.5, title: 'Mabit di Mina (malam 11)' },
    body: [
      'Bermalamlah di Mina. Besok Anda melontar tiga jumrah untuk terakhir kalinya bila memilih nafar awal.',
      'Perbanyak takbir muqayyad setelah shalat fardhu, dari Subuh 9 Dzulhijjah sampai Ashar 13 Dzulhijjah.'
    ],
    checklist: 'Mabit Mina malam 11'
  },
  {
    id: 'ramy-12',
    phase: 'Hari Tasyrik',
    title: 'Melontar 3 Jumrah (12 Dzulhijjah)',
    subtitle: '21 kerikil setelah zawal',
    zone: 'mina',
    view: 'jamarat',
    time: { day: 12, hour: 11.8, label: '12 Dzulhijjah • Jamarat' },
    kind: 'ramy',
    ramy: { targets: ['sughra', 'wustha', 'aqabah'], pebbles: 7, order: true, afterZawal: true },
    body: [
      'Lontar ketiga jumrah dengan urutan Sughra → Wustha → Aqabah, masing-masing 7 kerikil, setelah zawal.',
      'Setelah ini Anda boleh memilih <b>nafar awal</b> (meninggalkan Mina sebelum maghrib) atau <b>nafar tsani</b> (menginap lagi dan melontar pada 13 Dzulhijjah).'
    ],
    checklist: 'Ramy 12 Dzulhijjah (3 jumrah)'
  },
  {
    id: 'nafar',
    phase: 'Hari Tasyrik',
    title: 'Nafar: Pulang atau Lanjut?',
    subtitle: 'Keduanya sah — pilih dengan sadar',
    zone: 'mina',
    view: 'mina',
    kind: 'nafar',
    body: [
      'Nafar awal: meninggalkan Mina pada 12 Dzulhijjah <b>sebelum maghrib</b>. Bila matahari terbenam masih di Mina, Anda wajib melanjutkan ke nafar tsani dan melontar pada 13 Dzulhijjah.',
      'Nafar tsani: bermalam lagi di Mina, lalu melontar tiga jumrah pada 13 Dzulhijjah setelah zawal. Pahala lebih besar, tetapi menuntut kesabaran.'
    ],
    options: [
      {
        id: 'awal',
        title: 'Nafar Awal',
        desc: 'Keluar Mina hari ini sebelum maghrib. Selesai dengan ramy 12.',
        icon: 'early'
      },
      {
        id: 'tsani',
        title: 'Nafar Tsani',
        desc: 'Mabit lagi, lontar 3 jumrah pada 13 Dzulhijjah setelah zawal.',
        icon: 'late'
      }
    ],
    checklist: 'Memilih nafar'
  },
  {
    id: 'mabit-12',
    phase: 'Hari Tasyrik',
    title: 'Mabit Malam 12',
    subtitle: 'Persiapan ramy 13 Dzulhijjah',
    zone: 'mina',
    view: 'mina',
    time: { day: 12, hour: 18.0, label: '12 Dzulhijjah • Mina' },
    when: (s) => s.nafar === 'tsani',
    kind: 'mabit',
    mabit: { untilDay: 13, untilHour: 5.5, title: 'Mabit malam 12' },
    body: [
      'Anda memilih nafar tsani, maka bermalamlah di Mina. Besok lontar tiga jumrah setelah zawal, lalu menuju Makkah untuk tawaf wada\'.'
    ],
    checklist: 'Mabit Mina malam 12'
  },
  {
    id: 'ramy-13',
    phase: 'Hari Tasyrik',
    title: 'Melontar 3 Jumrah (13 Dzulhijjah)',
    subtitle: '21 kerikil setelah zawal',
    zone: 'mina',
    view: 'jamarat',
    time: { day: 13, hour: 11.8, label: '13 Dzulhijjah • Jamarat' },
    when: (s) => s.nafar === 'tsani',
    kind: 'ramy',
    ramy: { targets: ['sughra', 'wustha', 'aqabah'], pebbles: 7, order: true, afterZawal: true },
    body: [
      'Lontar tiga jumrah, masing-masing 7 kerikil, dengan urutan Sughra → Wustha → Aqabah setelah zawal.',
      'Setelah selesai, Anda boleh meninggalkan Mina menuju Makkah.'
    ],
    checklist: 'Ramy 13 Dzulhijjah (3 jumrah)'
  },
  {
    id: 'wada',
    phase: 'Tawaf Wada\'',
    title: 'Tawaf Wada\'',
    subtitle: 'Tawaf perpisahan sebelum meninggalkan Makkah',
    zone: 'haram',
    view: 'kaaba',
    kind: 'tawaf',
    tawaf: { laps: 7, ramlLaps: 0, wada: true },
    body: [
      'Sebelum meninggalkan Makkah, lakukan <b>tawaf wada\'</b> (tawaf perpisahan): 7 putaran tanpa sa\'i, tanpa raml dan idtiba\'.',
      'Setelah tawaf, jangan lagi berlama-lama di Makkah; langsung bersiap pulang. Wanita haid tidak wajib tawaf wada\'.'
    ],
    dalil: {
      arabic: 'لَا يَنْفِرَنَّ أَحَدٌ حَتَّى يَكُونَ آخِرُ عَهْدِهِ بِالْبَيْتِ',
      latin: 'Lā yanfiranna aḥadun ḥattā yakūna ākhiru ‘ahdihī bil-bait.',
      meaning: 'Janganlah seseorang meninggalkan (Makkah) sebelum akhir dari keberadaannya adalah di Baitullah.',
      source: 'HR. Bukhari'
    },
    tip: 'Tawaf wada\' adalah wajib; bila ditinggalkan, wajib dam. Bagi perempuan yang sedang haid/nifas, kewajiban ini gugur.',
    checklist: 'Tawaf wada\''
  },
  {
    id: 'selesai',
    phase: 'Selesai',
    title: 'Haji Selesai',
    subtitle: 'Semoga haji mabrur',
    zone: 'haram',
    view: 'kaaba',
    kind: 'finish',
    body: [
      'Rangkaian haji tamattu\' Anda selesai: ihram, mabit Mina, wukuf Arafah, mabit Muzdalifah, ramy, qurban, tahallul, tawaf ifadah, ramy hari tasyrik, dan tawaf wada\'.',
      'Haji mabrur adalah haji yang diterima: tidak ada dosa yang tersisa dan amal setelahnya lebih baik.'
    ],
    checklist: 'Haji selesai'
  }
];

/* ============================================================================
 * Varian jenis manasik haji: Tamattu' / Qiran / Ifrad
 * ========================================================================== */
export const HAJJ_TYPE_INFO = {
  tamattu: {
    id: 'tamattu',
    label: "Tamattu'",
    short: "Tamattu'",
    desc: 'Umrah dahulu, tahallul, lalu haji pada 8 Dzulhijjah.',
    hint: 'Wajib hadyu. Paling utama menurut jumhur ulama.',
    badge: 'Paling utama'
  },
  qiran: {
    id: 'qiran',
    label: 'Qiran',
    short: 'Qiran',
    desc: 'Umrah dan haji sekaligus dalam satu ihram.',
    hint: 'Wajib hadyu. Satu tawaf dan satu sa\'i untuk keduanya.',
    badge: 'Manasik Nabi ﷺ'
  },
  ifrad: {
    id: 'ifrad',
    label: 'Ifrad',
    short: 'Ifrad',
    desc: 'Haji saja, tanpa umrah di dalamnya.',
    hint: 'Tidak wajib hadyu. Sa\'i dikerjakan untuk haji.',
    badge: 'Tanpa hadyu'
  }
};

const hajjStep = (id) => HAJJ_STEPS.find((s) => s.id === id);

/* --- langkah khusus qiran ------------------------------------------------ */
const ihramQiran = {
  id: 'ihram-qiran',
  phase: 'Ihram Qiran',
  title: 'Ihram Qiran di Miqat',
  subtitle: 'Umrah & haji sekaligus • 7 Dzulhijjah',
  zone: 'haram',
  view: 'miqat',
  time: { day: 7, hour: 6.6, label: '7 Dzulhijjah • Miqat' },
  kind: 'info',
  body: [
    'Haji <b>qiran</b> berarti berihram untuk umrah dan haji sekaligus — atau berihram haji lalu memasukkan umrah ke dalamnya. Niatnya: <i>“Labbaika ‘umratan wa ḥajjan”</i>.',
    'Karena membawa hadyu, Anda <b>tetap dalam ihram</b> sampai hari raya. Tidak ada tahallul setelah tawaf qudum, dan hadyu wajib disembelih bagi yang mampu.',
    'Sunnah: mandi, memakai wangi-wangian sebelum niat, shalat dua rakaat, lalu talbiyah sepanjang perjalanan.'
  ],
  talbiyah: true,
  dalil: {
    arabic: 'فَمَنْ تَمَتَّعَ بِالْعُمْرَةِ إِلَى الْحَجِّ فَمَا اسْتَيْسَرَ مِنَ الْهَدْيِ',
    latin: 'Faman tamatta‘a bil-‘umrati ilal-ḥajji famā istaysara minal-hady.',
    meaning: 'Barangsiapa berhaji tamattu\', maka (wajib) hadyu yang mudah diperoleh.',
    source: 'QS. Al-Baqarah: 196'
  },
  tip: 'Qiran dipilih ketika membawa hadyu. Nabi ﷺ berihram dengan umrah dan haji (HR. Muslim); bagi yang tidak membawa hadyu, tamattu\' lebih utama.',
  checklist: 'Ihram qiran & talbiyah'
};

const tawafQudum = {
  id: 'tawaf-qudum',
  phase: 'Tawaf Qudum',
  title: 'Tawaf Qudum',
  subtitle: 'Tawaf kedatangan • tanpa sa\'i',
  zone: 'haram',
  view: 'kaaba',
  time: { day: 7, hour: 9.5, label: '7 Dzulhijjah • Masjidil Haram' },
  kind: 'tawaf',
  tawaf: { laps: 7, ramlLaps: 3, qudum: true },
  body: [
    'Tawaf qudum adalah tawaf kedatangan; hukumnya <b>sunnah</b>, bukan rukun. Lakukan 7 putaran mengelilingi Ka\'bah.',
    'Tidak ada sa\'i setelah tawaf ini. Sa\'i haji menyusul setelah tawaf ifadah, dan Anda <b>tetap ihram</b> sampai tahallul pada 10 Dzulhijjah.'
  ],
  dalil: {
    arabic: 'وَلْيَطَّوَّفُوا بِالْبَيْتِ الْعَتِيقِ',
    latin: 'Wal yaṭṭawwafū bil-baitil-‘atīq.',
    meaning: 'Dan hendaklah mereka bertawaf mengelilingi Baitullah yang tua itu.',
    source: 'QS. Al-Hajj: 29'
  },
  tip: 'Jangan bertahalul setelah tawaf qudum. Larangan ihram masih berlaku sampai tahallul di hari raya.',
  checklist: 'Tawaf qudum'
};

const qurbanQiran = {
  ...hajjStep('qurban'),
  id: 'qurban-qiran',
  title: 'Hadyu Qiran',
  body: [
    'Karena Anda haji qiran, Anda wajib menyembelih <b>hadyu</b> (seekor kambing, atau sepertujuh sapi). Bila tidak mampu, berpuasa 3 hari di tanah suci dan 7 hari setelah pulang.',
    'Daging hadyu dibagikan kepada fakir miskin di tanah haram. Anda tidak harus menyembelih sendiri; bisa diwakilkan melalui lembaga resmi.'
  ],
  quiz: {
    ...hajjStep('qurban').quiz,
    question: 'Apa konsekuensi bila hadyu qiran ditinggalkan padahal mampu?',
    explain: 'Rukun haji tidak bisa diganti dam; wajib haji bisa ditutup dengan dam. Hadyu qiran termasuk wajib.'
  },
  checklist: 'Hadyu qiran'
};

const ifadahQiran = {
  ...hajjStep('ifadah'),
  id: 'ifadah-qiran',
  title: 'Tawaf Ifadah (Qiran)',
  body: [
    'Tawaf ifadah adalah <b>rukun haji</b> — 7 putaran mengelilingi Ka\'bah.',
    'Setelah ini Anda mengerjakan sa\'i 7 kali. Untuk qiran, satu tawaf ifadah dan satu sa\'i sudah mencakup umrah dan haji sekaligus.'
  ],
  checklist: 'Tawaf ifadah'
};

const saiQiran = {
  id: 'sai-qiran',
  phase: 'Sa\'i',
  title: 'Sa\'i Qiran',
  subtitle: '7 kali • untuk umrah dan haji',
  zone: 'haram',
  view: 'masaa',
  kind: 'sai',
  sai: { legs: 7 },
  body: [
    'Sa\'i 7 kali dari Safa ke Marwah, berakhir di Marwah.',
    'Dalam qiran, sa\'i ini mencakup umrah dan haji sekaligus. Setelah sa\'i, Anda bertahalul penuh dan seluruh larangan ihram berakhir.'
  ],
  dalil: {
    arabic: 'إِنَّ الصَّفَا وَالْمَرْوَةَ مِنْ شَعَائِرِ اللهِ',
    latin: 'Innaṣ-ṣafā wal-marwata min sya‘ā\'irillāh.',
    meaning: 'Sesungguhnya Safa dan Marwah adalah sebagian dari syiar-syiar Allah.',
    source: 'QS. Al-Baqarah: 158'
  },
  tip: 'Jangan mengulang tawaf dan sa\'i untuk umrah secara terpisah — dalam qiran keduanya cukup sekali.',
  checklist: 'Sa\'i qiran'
};

const selesaiQiran = {
  ...hajjStep('selesai'),
  id: 'selesai-qiran',
  title: 'Haji Qiran Selesai',
  body: [
    'Rangkaian haji qiran Anda selesai: ihram umrah+haji, tawaf qudum, mabit Mina, wukuf Arafah, mabit Muzdalifah, ramy, hadyu, tahallul, satu tawaf ifadah, satu sa\'i, ramy hari tasyrik, dan tawaf wada\'.',
    'Haji mabrur adalah haji yang diterima: tidak ada dosa yang tersisa dan amal setelahnya lebih baik.'
  ],
  checklist: 'Haji qiran selesai'
};

/* --- langkah khusus ifrad ------------------------------------------------ */
const ihramIfrad = {
  id: 'ihram-ifrad',
  phase: 'Ihram Ifrad',
  title: 'Ihram Ifrad di Miqat',
  subtitle: 'Haji saja • tanpa hadyu',
  zone: 'haram',
  view: 'miqat',
  time: { day: 7, hour: 6.6, label: '7 Dzulhijjah • Miqat' },
  kind: 'info',
  body: [
    'Haji <b>ifrad</b> berarti berihram untuk haji saja, tanpa umrah di dalamnya. Niatnya: <i>“Labbaika ḥajjan”</i>.',
    'Tidak ada hadyu dalam ifrad. Anda tetap ihram sampai tahallul pada 10 Dzulhijjah. Bila ingin berumrah setelah haji, boleh ihram dari Tan\'im atau Ji\'ranah.'
  ],
  talbiyah: true,
  dalil: {
    arabic: 'وَأَتِمُّوا الْحَجَّ وَالْعُمْرَةَ لِلَّهِ',
    latin: 'Wa atimmul-ḥajja wal-‘umrata lillāh.',
    meaning: 'Dan sempurnakanlah haji dan umrah karena Allah.',
    source: 'QS. Al-Baqarah: 196'
  },
  tip: 'Ifrad sah dan tidak dikenai hadyu; namun tamattu\' lebih utama bagi yang tidak membawa hadyu.',
  checklist: 'Ihram ifrad & talbiyah'
};

const ifradHadyu = {
  id: 'ifrad-hadyu',
  phase: '10 Dzulhijjah',
  title: 'Ifrad: Tanpa Hadyu',
  subtitle: 'Tidak ada kewajiban menyembelih',
  zone: 'mina',
  view: 'mina',
  time: { day: 10, hour: 8.2, label: '10 Dzulhijjah • Mina' },
  kind: 'info',
  body: [
    'Haji ifrad <b>tidak</b> dikenai hadyu. Hadyu hanya wajib pada tamattu\' dan qiran.',
    'Bila Anda ingin menunaikan umrah setelah haji, boleh berihram dari Tan\'im (seperti yang diperintahkan Nabi ﷺ kepada Aisyah) atau Ji\'ranah, lalu tawaf dan sa\'i.'
  ],
  tip: 'Jangan menyembelih hadyu karena mengira ifrad wajib; itu tidak disyariatkan.',
  checklist: 'Ifrad tanpa hadyu'
};

const ifadahIfrad = {
  ...hajjStep('ifadah'),
  id: 'ifadah-ifrad',
  title: 'Tawaf Ifadah (Ifrad)',
  body: [
    'Tawaf ifadah adalah <b>rukun haji</b> — 7 putaran mengelilingi Ka\'bah.',
    'Setelah ini Anda mengerjakan sa\'i 7 kali untuk haji. Tidak ada sa\'i umrah karena ifrad tidak mencakup umrah.'
  ],
  checklist: 'Tawaf ifadah'
};

const saiIfrad = {
  id: 'sai-ifrad',
  phase: 'Sa\'i',
  title: 'Sa\'i Ifrad',
  subtitle: '7 kali • untuk haji',
  zone: 'haram',
  view: 'masaa',
  kind: 'sai',
  sai: { legs: 7 },
  body: [
    'Sa\'i 7 kali dari Safa ke Marwah, berakhir di Marwah.',
    'Sa\'i ini dikerjakan untuk haji. Setelah sa\'i, Anda bertahalul penuh dan larangan ihram berakhir.'
  ],
  dalil: {
    arabic: 'إِنَّ الصَّفَا وَالْمَرْوَةَ مِنْ شَعَائِرِ اللهِ',
    latin: 'Innaṣ-ṣafā wal-marwata min sya‘ā\'irillāh.',
    meaning: 'Sesungguhnya Safa dan Marwah adalah sebagian dari syiar-syiar Allah.',
    source: 'QS. Al-Baqarah: 158'
  },
  tip: 'Bila ingin umrah setelah haji, lakukan ihram baru dari Tan\'im atau Ji\'ranah — bukan dari Makkah.',
  checklist: 'Sa\'i ifrad'
};

const selesaiIfrad = {
  ...hajjStep('selesai'),
  id: 'selesai-ifrad',
  title: 'Haji Ifrad Selesai',
  body: [
    'Rangkaian haji ifrad Anda selesai: ihram haji, tawaf qudum, mabit Mina, wukuf Arafah, mabit Muzdalifah, ramy, tahallul, tawaf ifadah, sa\'i, ramy hari tasyrik, dan tawaf wada\'.',
    'Haji mabrur adalah haji yang diterima: tidak ada dosa yang tersisa dan amal setelahnya lebih baik.'
  ],
  checklist: 'Haji ifrad selesai'
};

/* --- susunan tahap per jenis -------------------------------------------- */
const HAJJ_TAMATTU = [
  hajjStep('hajj-ihram'),
  hajjStep('mina-8'),
  hajjStep('arafah'),
  hajjStep('muzdalifah'),
  hajjStep('aqabah'),
  hajjStep('qurban'),
  hajjStep('halq-10'),
  hajjStep('ifadah'),
  hajjStep('mina-10'),
  hajjStep('ramy-11'),
  hajjStep('mina-11'),
  hajjStep('ramy-12'),
  hajjStep('nafar'),
  hajjStep('mabit-12'),
  hajjStep('ramy-13'),
  hajjStep('wada'),
  hajjStep('selesai')
];

const HAJJ_QIRAN = [
  ihramQiran,
  tawafQudum,
  hajjStep('mina-8'),
  hajjStep('arafah'),
  hajjStep('muzdalifah'),
  hajjStep('aqabah'),
  qurbanQiran,
  hajjStep('halq-10'),
  ifadahQiran,
  saiQiran,
  hajjStep('mina-10'),
  hajjStep('ramy-11'),
  hajjStep('mina-11'),
  hajjStep('ramy-12'),
  hajjStep('nafar'),
  hajjStep('mabit-12'),
  hajjStep('ramy-13'),
  hajjStep('wada'),
  selesaiQiran
];

const HAJJ_IFRAD = [
  ihramIfrad,
  tawafQudum,
  hajjStep('mina-8'),
  hajjStep('arafah'),
  hajjStep('muzdalifah'),
  hajjStep('aqabah'),
  ifradHadyu,
  hajjStep('halq-10'),
  ifadahIfrad,
  saiIfrad,
  hajjStep('mina-10'),
  hajjStep('ramy-11'),
  hajjStep('mina-11'),
  hajjStep('ramy-12'),
  hajjStep('nafar'),
  hajjStep('mabit-12'),
  hajjStep('ramy-13'),
  hajjStep('wada'),
  selesaiIfrad
];

export const STEPS = {
  umrah: UMRAH_STEPS,
  hajj: {
    tamattu: HAJJ_TAMATTU,
    qiran: HAJJ_QIRAN,
    ifrad: HAJJ_IFRAD
  }
};

/* ============================================================================
 * Referensi fikih (panel samping)
 * ========================================================================== */
export const REFERENCE = {
  rukun: {
    umrah: [
      'Ihram (niat)',
      'Tawaf 7 putaran',
      'Sa\'i 7 kali',
      'Tahallul'
    ],
    haji: [
      'Ihram',
      'Wukuf di Arafah',
      'Tawaf ifadah',
      'Sa\'i (bagi yang belum melakukannya)',
      'Tahallul'
    ]
  },
  wajib: {
    umrah: [
      'Ihram dari miqat',
      'Menjauhi larangan ihram',
      'Tidak meninggalkan salah satu rukun'
    ],
    haji: [
      'Ihram dari miqat',
      'Mabit di Muzdalifah',
      'Mabit di Mina pada malam-malam tasyrik',
      'Melontar jumrah',
      'Hadyu bagi tamattu\' & qiran',
      'Tawaf wada\''
    ]
  },
  larangan: [
    { title: 'Memotong rambut & kuku', note: 'Termasuk mencabut atau mencukur sebagian.' },
    { title: 'Memakai wangi-wangian', note: 'Pada badan maupun kain ihram, setelah niat.' },
    { title: 'Berhubungan suami-istri', note: 'Termasuk pendahuluannya; yang paling berat.' },
    { title: 'Akad nikah & menikahkan', note: 'Tidak boleh menjadi wali atau saksi.' },
    { title: 'Berburu binatang darat', note: 'Kecuali yang berbahaya.' },
    { title: 'Menebang/memotong tanaman haram', note: 'Tanaman di tanah haram, termasuk rumput.' },
    { title: 'Pakaian berjahit & penutup kepala', note: 'Khusus laki-laki: izar dan rida tanpa jahitan.' },
    { title: 'Niqab & sarung tangan', note: 'Khusus perempuan menurut jumhur; sebagian ulama membolehkan bila ada ajnabi.' },
    { title: 'Rafats, fusuq, jidal', note: 'Kata kotor, maksiat, dan bertengkar.' }
  ],
  miqat: [
    { name: 'Dzul Hulaifah (Bir Ali)', for: 'Jamaah dari Madinah', note: '± 450 km dari Makkah.' },
    { name: 'Yalamlam', for: 'Jamaah dari Yaman & Asia (termasuk Indonesia via laut/udara)', note: 'Yang paling umum bagi jamaah Indonesia.' },
    { name: 'Qarn al-Manazil (As-Sail)', for: 'Jamaah dari Najd & arah timur', note: 'Sering dipakai jamaah dari Indonesia lewat udara.' },
    { name: 'Juhfah (Rabigh)', for: 'Jamaah dari Syam & Mesir', note: '' },
    { name: 'Dzatu \'Irq', for: 'Jamaah dari Irak', note: '' },
    { name: 'Makkah', for: 'Miqat haji bagi yang sudah di Makkah', note: 'Untuk umrah dari Makkah: Tan\'im atau Ji\'ranah.' }
  ],
  dam: [
    { title: 'Dam tamattu\' / qiran', desc: 'Hadyu: 1 kambing, atau 1/7 sapi, atau puasa 3 hari di tanah suci + 7 hari di rumah.' },
    { title: 'Dam karena meninggalkan wajib', desc: '1 kambing, atau puasa 10 hari. Contoh: tidak mabit, tidak melontar, tidak tawaf wada\'.' },
    { title: 'Fidyah karena melanggar larangan', desc: 'Pilihan: puasa 3 hari, bersedekah 3 sha\' makanan untuk 6 orang miskin, atau menyembelih 1 kambing.' },
    { title: 'Tidak bisa membayar dam?', desc: 'Berpuasa sesuai ketentuan; sebagian ulama membolehkan menunda sampai mampu.' }
  ],
  istilah: [
    { term: 'Ihram', desc: 'Niat masuk ke dalam haji/umrah dengan memakai pakaian ihram dan meninggalkan larangan.' },
    { term: 'Talbiyah', desc: 'Seruan "Labbaik Allahumma labbaik" sejak niat hingga mulai melontar Aqabah.' },
    { term: 'Idtiba\'', desc: 'Membuka pundak kanan (kain di bawah ketiak kiri) saat tawaf bagi laki-laki.' },
    { term: 'Raml', desc: 'Berjalan cepat dengan langkah pendek pada 3 putaran pertama tawaf.' },
    { term: 'Istilam', desc: 'Menghadap Hajar Aswad untuk memberi isyarat/takbir.' },
    { term: 'Mabit', desc: 'Bermalam di Muzdalifah atau Mina.' },
    { term: 'Wukuf', desc: 'Berhenti/berada di Arafah antara zawal dan maghrib pada 9 Dzulhijjah.' },
    { term: 'Ramy', desc: 'Melontar jumrah dengan 7 kerikil.' },
    { term: 'Tahallul', desc: 'Mencukur/memotong rambut sebagai tanda berakhirnya ihram.' },
    { term: 'Nafar', desc: 'Meninggalkan Mina: nafar awal (12 Dzulhijjah) atau nafar tsani (13 Dzulhijjah).' }
  ]
};

/* ============================================================================
 * Timeline haji (panel referensi)
 * ========================================================================== */
export const HAJJ_TIMELINE = [
  { day: '8 Dzulhijjah', title: 'Tarwiyah', desc: 'Ihram haji, menuju Mina, mabit.', icon: 'mina' },
  { day: '9 Dzulhijjah', title: 'Arafah', desc: 'Wukuf dari zawal sampai maghrib. Inti haji.', icon: 'arafah' },
  { day: '9–10 Dzulhijjah', title: 'Muzdalifah', desc: 'Mabit, ambil kerikil, shalat Subuh.', icon: 'muzdalifah' },
  { day: '10 Dzulhijjah', title: 'Nahr', desc: 'Ramy Aqabah, qurban, tahallul, tawaf ifadah.', icon: 'jamarat' },
  { day: '11–12 Dzulhijjah', title: 'Tasyrik', desc: 'Mabit Mina, ramy 3 jumrah setiap hari setelah zawal.', icon: 'mina' },
  { day: '12/13 Dzulhijjah', title: 'Nafar', desc: 'Nafar awal atau tsani, lalu tawaf wada\'.', icon: 'kaaba' }
];
