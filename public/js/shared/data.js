// ============================================================
// DATA STORE (simulated localStorage-free, in-memory)
// ============================================================
const appState = {
  currentUser: null,
  users: [
    { id: 1, name: 'Admin', email: 'admin@turismo.es', password: 'admin123', role: 'admin', date: '2025-01-01' }
  ],
  markers: [],  // loaded below
  selectedProvince: null,
  filterCat: null,
  activeLeafletMarkers: [],
  ratings: {},       // { markerName: [{user, stars, comment, date}] }
  pendingRating: null, // { name, province }
  clusterGroup: null
};

const dayPlans = {
  'Ávila': {
    dia1: [
      { time: '10:00', place: 'Muralla de Ávila',                    desc: 'Acceso por la Puerta del Alcázar. Recorre los adarves de las murallas medievales mejor conservadas de Europa.', photo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e5/Murallas_de_%C3%81vila_desde_los_Cuatro_Postes.jpg/800px-Murallas_de_%C3%81vila_desde_los_Cuatro_Postes.jpg' },
      { time: '12:00', place: 'Catedral de San Salvador',            desc: 'La primera catedral gótica de España, integrada en la propia muralla. El ábside es también torreón defensivo.', photo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/5b/Catedral_de_%C3%81vila.jpg/800px-Catedral_de_%C3%81vila.jpg' },
      { time: '16:30', place: 'Basílica de San Vicente',             desc: 'Románica del s.XII con un cenotafio excepcional y una atmósfera sobrecedora difícil de describir.', photo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/2f/Basilica_San_Vicente_Avila.jpg/800px-Basilica_San_Vicente_Avila.jpg' },
      { time: '19:00', place: 'Humilladero de los Cuatro Postes',    desc: 'Atardecer con la vista más icónica de Ávila. Las murallas rojas bajo el cielo del ocaso son mágicas.', photo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e5/Murallas_de_%C3%81vila_desde_los_Cuatro_Postes.jpg/800px-Murallas_de_%C3%81vila_desde_los_Cuatro_Postes.jpg' },
    ],
    dia2: [
      { time: '10:30', place: 'Cuevas del Águila',                   desc: 'Arenas de San Pedro. Formaciones kársticas de gran belleza. Horario: 10:30-13:00 y 15:00-18:00.', photo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/d4/Laguna_Negra_de_Urbion.jpg/800px-Laguna_Negra_de_Urbion.jpg' },
      { time: '16:00', place: 'Castillo de la Adrada / Ruta Gredos', desc: 'Paseo por el Castillo de la Adrada o ruta de senderismo por las laderas de la Sierra de Gredos.', photo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/9e/Las_M%C3%A9dulas_2.jpg/800px-Las_M%C3%A9dulas_2.jpg' },
    ],
    dia3: [
      { time: '10:00', place: 'Castillo de Arévalo',                 desc: 'Imponente fortaleza medieval en la comarca de La Moraña, dominando la confluencia de los ríos Adaja y Arevalillo.' },
      { time: '12:00', place: 'Iglesia de Santa María la Mayor',     desc: 'Joya del mudéjar abulense en Arévalo, con su característica torre de ladrillo.' },
      { time: '16:30', place: 'Museo del Cereal',                    desc: 'Descubre la historia agrícola de La Moraña en este museo único dedicado al cereal castellano.' },
      { time: '18:30', place: 'Convento Agustino de Extramuros',     desc: 'Convento histórico en Madrigal de las Altas Torres, cuna de Isabel la Católica.' },
    ],
    dia4: [
      { time: '10:00', place: 'Castillo Palacio de Magalia',         desc: 'Imponente castillo-palacio en Las Navas del Marqués, rodeado de bosques de pinos.' },
      { time: '12:30', place: 'Museo de Adolfo Suárez y la Transición', desc: 'Museo dedicado al primer presidente de la democracia española en su ciudad natal, Cebreros.' },
      { time: '16:00', place: 'Casa del Parque Valle de Iruelas',    desc: 'Centro de interpretación del Paraje Natural del Valle de Iruelas, hogar del buitre negro.' },
    ],
    dia5: [
      { time: '10:00', place: 'Castillo de La Adrada',               desc: 'Fortaleza medieval en el Valle del Tiétar con vistas espectaculares a la sierra.' },
      { time: '12:00', place: 'Museo de las Abejas',                 desc: 'Curioso museo apícola en Poyales del Hoyo que descubre el mundo de la apicultura tradicional.' },
      { time: '16:00', place: 'Museo del Juguete de Hojalata ? Casa de las Flores', desc: 'Singular colección de juguetes de hojalata en Candeleda, un viaje a la infancia del s.XX.' },
    ],
    dia6: [
      { time: '09:30', place: 'Casa del Parque de la Sierra de Gredos (Zona Norte)', desc: 'Centro de interpretación del Parque Regional de la Sierra de Gredos en Hoyos del Espino.' },
      { time: '12:30', place: 'Museo Etnográfico de Becedas Stanley Brandes', desc: 'Extraordinario museo etnográfico que recoge la vida rural tradicional de la sierra abulense.' },
      { time: '16:00', place: 'Museo-Basílica de San Vicente',       desc: 'La Basílica románica de San Vicente, uno de los templos más bellos del románico español.' },
    ],
    dia7: [
      { time: '10:00', place: 'Plaza del Mercado Chico (Ávila)',     desc: 'El corazón de la vida ciudadana abulense, rodeada de arquitectura histórica.' },
      { time: '11:30', place: 'Centro Internacional de Estudios Místicos (CIEM)', desc: 'Centro dedicado al pensamiento místico y a la figura de Santa Teresa de Ávila.' },
      { time: '16:00', place: 'Ecomuseo - Centro de Interpretación del Valle Amblés', desc: 'Descubre el patrimonio natural y etnográfico del Valle Amblés en Muñogalindo.' },
      { time: '18:30', place: 'Museo-Collegium',                     desc: 'Espacio cultural que recoge la historia y el patrimonio de la comarca abulense.' },
    ],
  },
  'Burgos': {
    dia1: [
      { time: '09:30', place: 'Catedral de Burgos',                   desc: 'La joya del gótico castellano. Reserva al menos 1,5 horas para admirar sus vidrieras, el Cid y las agujas.', photo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/4a/BurgosCathedral.jpg/800px-BurgosCathedral.jpg' },
      { time: '12:00', place: 'Monasterio de las Huelgas',            desc: 'Real Monasterio cisterciense del s.XII, panteón de reyes de Castilla y tesoro medieval único.', photo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/72/Fromista_San_Martin.jpg/800px-Fromista_San_Martin.jpg' },
      { time: '16:30', place: 'Museo de la Evolución Humana',         desc: 'Uno de los mejores museos de España. Los fósiles de Atapuerca cuentan 800.000 años de historia. Cierra a las 20:00.' },
    ],
    dia2: [
      { time: '10:00', place: 'Yacimientos de Atapuerca',             desc: 'Patrimonio UNESCO. Requiere reserva previa. Los restos humanos más antiguos de Europa, de hace 800.000 años.', photo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/5e/Atapuerca_TD6.jpg/800px-Atapuerca_TD6.jpg' },
      { time: '16:30', place: 'Monasterio de Santo Domingo de Silos', desc: 'El claustro románico más bello de España. Cierra a las 18:00/19:00 según temporada.', photo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/5a/Claustro_de_Santo_Domingo_de_Silos.jpg/800px-Claustro_de_Santo_Domingo_de_Silos.jpg' },
    ],
    dia3: [
      { time: '10:00', place: 'Colegiata de San Pedro (Lerma)',       desc: 'Magnífica colegiata barroca en la villa ducal de Lerma, uno de los conjuntos barrocos más importantes de España.' },
      { time: '12:00', place: 'Museo y Centro de Interpretación de la Historia de Lerma', desc: 'Recorre la historia de la villa ducal y el legado del Duque de Lerma en este completo museo.' },
      { time: '16:30', place: 'Museo-Colegiata de Covarrubias de San Cosme y San Damián', desc: 'Colegiata medieval en Covarrubias que alberga el sepulcro de Fernán González.' },
    ],
    dia4: [
      { time: '10:00', place: 'Sala Románica de Exposiciones del Monasterio de Santo Domingo de Silos',                desc: 'Impresionante sala románica adosada al monasterio de Silos con capiteles únicos.' },
      { time: '12:30', place: 'Museo del Libro Fadrique de Basilea',  desc: 'Singular museo en Burgos dedicado a la historia del libro y la imprenta en Castilla.' },
      { time: '16:00', place: 'Cultural Cordón (Casa del Cordón)',    desc: 'Palacio gótico burgalés donde los Reyes Católicos recibieron a Colón tras su segundo viaje a América.' },
    ],
    dia5: [
      { time: '10:00', place: 'Iglesia de Santa María la Real',       desc: 'Impresionante iglesia gótica en Aranda de Duero, con una portada plateresca de gran riqueza.' },
      { time: '12:30', place: 'Museo del Ferrocarril III Generaciones', desc: 'Museo dedicado a la historia del ferrocarril en Castilla, con locomotoras y material histórico original.' },
      { time: '16:30', place: 'Centro de Arqueología Experimental (CAREX)', desc: 'Centro en Atapuerca donde experimentar las técnicas de vida del Paleolítico de forma vivencial.' },
    ],
    dia6: [
      { time: '10:00', place: 'Convento Museo de Santa Clara / Museo de los Condestables de Castilla', desc: 'El convento de Santa Clara en Medina de Pomar alberga uno de los tesoros medievales mejor conservados.' },
      { time: '14:00', place: 'Centro de Interpretación Arqueológica desfiladero de la Horadada', desc: 'El impresionante desfiladero natural en el norte de Burgos, con rica historia arqueológica.' },
    ],
    dia7: [
      { time: '10:00', place: 'Casa del Parque de Ojo Guareña',       desc: 'El complejo kárstico de Ojo Guareña es uno de los sistemas de cuevas más grandes de Europa.' },
      { time: '13:00', place: 'Museo Municipal de Villadiego',        desc: 'Museo que recoge el patrimonio histórico y etnográfico de la comarca de Villadiego.' },
      { time: '17:00', place: 'Plaza de San Juan (Burgos)',           desc: 'Emblemática plaza burgalesa rodeada de arquitectura histórica y el corazón del barrio medieval.' },
    ],
  },
  'León': {
    dia1: [
      { time: '09:30', place: 'Catedral de León',                     desc: 'La Pulchra Leonina. 1.800 m² de vidrieras medievales crean una experiencia de luz única en España.', photo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/7c/Le%C3%B3n_-_Catedral_de_Le%C3%B3n_%28Pulchra_Leonina%29.jpg/800px-Le%C3%B3n_-_Catedral_de_Le%C3%B3n_%28Pulchra_Leonina%29.jpg' },
      { time: '11:30', place: 'Casa Botines (Gaudí)',                  desc: 'Una de las tres obras de Gaudí fuera de Cataluña. Hoy museo, con sorpresas en el interior.', photo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/51/Casa_Botines_%28Le%C3%B3n%29.jpg/800px-Casa_Botines_%28Le%C3%B3n%29.jpg' },
      { time: '16:30', place: 'Panteón Real y Colegiata de San Isidoro', desc: 'El "Sixtino del Románico". Las pinturas del s.XII del Panteón Real son absolutamente imprescindibles.', photo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/2e/Leon_Colegiata_San_Isidoro.jpg/800px-Leon_Colegiata_San_Isidoro.jpg' },
    ],
    dia2: [
      { time: '11:00', place: 'Las Médulas',                          desc: 'Patrimonio UNESCO. Centro de recepción de visitantes. Antiguas minas romanas de oro de tierra roja única.', photo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/9e/Las_M%C3%A9dulas_2.jpg/800px-Las_M%C3%A9dulas_2.jpg' },
      { time: '17:00', place: 'Palacio Episcopal de Astorga',         desc: 'Diseñado por Gaudí, este palacio neogótico alberga el Museo de los Caminos del Jacobeo.', photo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/5c/Astorga_-_Palacio_Episcopal.jpg/800px-Astorga_-_Palacio_Episcopal.jpg' },
    ],
    dia3: [
      { time: '10:00', place: 'Museo de la Catedral de Astorga',               desc: 'Colección arqueológica sobre la Asturica Augusta romana, cruce de calzadas del Imperio.' },
      { time: '12:30', place: 'San Marcos. Anexo del Museo de León',  desc: 'El espectacular convento de San Marcos, hoy Parador, con su fachada plateresca del s.XVI.' },
      { time: '16:30', place: 'Iglesia de San Tirso (Sahagún)',       desc: 'Magnífica iglesia románica de ladrillo en Sahagún, capital del románico mudéjar leonés.' },
    ],
    dia4: [
      { time: '10:00', place: 'Ene. Museo Nacional de la Energía',    desc: 'Museo innovador en Ponferrada dedicado a la historia de la energía y la minería del Bierzo.' },
      { time: '13:00', place: 'Museo del Monasterio Santa María de Carracedo', desc: 'Imponentes ruinas del monasterio benedictino de Carracedo, panteón de los reyes de León.' },
      { time: '16:30', place: 'Casa del Parque de Las Médulas',       desc: 'Centro de interpretación del paisaje minero romano más espectacular de Europa.' },
    ],
    dia5: [
      { time: '10:00', place: 'Cueva de Valporquero',                 desc: 'Una de las mayores cuevas de España, con formaciones kársticas de extraordinaria belleza en la montaña leonesa.' },
      { time: '14:30', place: 'Museo Etnográfico Montaña de Riaño',   desc: 'Recoge la vida tradicional de los pueblos de la Montaña Leonesa antes del embalse de Riaño.' },
    ],
    dia6: [
      { time: '10:00', place: 'Museo Textil de Val de San Lorenzo - Batán Museo', desc: 'El arte textil tradicional de las mantas de Val de San Lorenzo, Indicación Geográfica Protegida.' },
      { time: '13:00', place: 'Fundación Sierra Pambley',             desc: 'Notable museo en León dedicado a la ilustración y reforma educativa del s.XIX.' },
      { time: '16:30', place: 'Museo del Encaje - Filial del Museo del Encaje de Tordesillas', desc: 'El arte del encaje de bolillos en Villar del Monte, tradición artesanal centenaria.' },
    ],
    dia7: [
      { time: '10:00', place: 'Santuario de la Peregrina (Sahagún)',  desc: 'Curioso santuario barroco en Sahagún que recuerda el paso de los peregrinos del Camino de Santiago.' },
      { time: '12:30', place: 'Fundación Carriegos', desc: 'Fundación cultural leonesa dedicada a la preservación y difusión del patrimonio artístico y cultural del Bierzo.' },
      { time: '16:00', place: 'Ateneo Cultural El Albéitar (Universidad de León)', desc: 'Espacio cultural de la Universidad de León dedicado a exposiciones, conferencias y actividades culturales.' },
    ],
  },
  'Palencia': {
    dia1: [
      { time: '10:00', place: 'Catedral de San Antolín',              desc: 'La "Bella Desconocida" del gótico castellano. Su cripta visigoda y el Retablo Mayor de Vigarni son únicos.', photo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/d3/Catedral_de_Palencia.jpg/800px-Catedral_de_Palencia.jpg' },
      { time: '12:30', place: 'Museo de Palencia (Casa del Cordón)',  desc: 'Colección arqueológica e histórica en un palacio del s.XVI con colecciones ibéricas y romanas excepcionales.' },
      { time: '17:00', place: 'Cristo del Otero',                     desc: 'Subida al cerro para contemplar la escultura monumental de Victorio Macho y las vistas panorámicas de la ciudad.' },
    ],
    dia2: [
      { time: '10:30', place: 'Villa Romana de La Olmeda',            desc: 'La villa romana mejor conservada de España: 4.000 m² de mosaicos polícromos. Horario: 10:30-18:30.', photo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/5b/Villa_Romana_La_Olmeda.jpg/800px-Villa_Romana_La_Olmeda.jpg' },
      { time: '16:30', place: 'Iglesia de San Martín de Frómista',    desc: 'Una de las iglesias románicas más perfectas del mundo, junto al Canal de Castilla en el Camino de Santiago.', photo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/72/Fromista_San_Martin.jpg/800px-Fromista_San_Martin.jpg' },
    ],
    dia3: [
      { time: '10:00', place: 'Museo de Arte Sacro de Ampudia',        desc: 'Importante colección de arte sacro en la colegiata de Ampudia, en plena Tierra de Campos.' },
      { time: '12:30', place: 'Museo del Monasterio de Santa Clara',  desc: 'Tesoro artístico del convento de Santa Clara en Palencia, con obras de los siglos XIV al XVIII.' },
      { time: '16:30', place: 'Iglesia de San Miguel (Palencia)',     desc: 'Gótica iglesia palentina donde se dice que se desposó El Cid con Doña Jimena.' },
    ],
    dia4: [
      { time: '10:00', place: 'Centro de Documentación del Arte Románico', desc: 'Centro dedicado a documentar y difundir el extraordinario legado románico de la provincia de Palencia.' },
      { time: '12:00', place: 'Colegiata de San Miguel (Aguilar de Campoo)', desc: 'Imponente colegiata románica y gótica en Aguilar de Campoo, capital del románico palentino.' },
      { time: '16:30', place: 'Casa del Parque de Fuentes Carrionas (Cervera de Pisuerga)', desc: 'Centro de interpretación del parque natural de la Montaña Palentina, hogar del oso pardo.' },
    ],
    dia5: [
      { time: '10:00', place: 'Museo del Románico',        desc: 'Museo dedicado al arte románico en el corazón del Camino de Santiago palentino.' },
      { time: '12:30', place: 'Iglesia del Monasterio de San Zoilo',  desc: 'El impresionante claustro plateresco del monasterio de San Zoilo en Carrión de los Condes.' },
      { time: '16:30', place: 'Centro de Interpretación del Canal de Castilla (Herrera de Pisuerga)', desc: 'El Canal de Castilla, obra maestra de la ingeniería ilustrada del s.XVIII en Herrera de Pisuerga.' },
    ],
    dia6: [
      { time: '10:00', place: 'Museo Etnográfico Piedad Isla',        desc: 'Colección etnográfica que recoge los usos y costumbres de la sociedad tradicional palentina.' },
      { time: '13:00', place: 'Mirador de las Estrellas',             desc: 'Observatorio astronómico en la Montaña Palentina, uno de los cielos más oscuros de España.' },
      { time: '16:30', place: 'Sala Don Sancho (Palencia)',           desc: 'Espacio cultural en el corazón de Palencia dedicado a la difusión de las artes.' },
    ],
    dia7: [
      { time: '10:00', place: 'Casa Junco. Palacio de los Aguado-Pardo', desc: 'Palacio señorial del s.XVII en Palencia, ejemplo de la arquitectura civil barroca castellana.' },
      { time: '12:30', place: 'Museo Parroquial',                     desc: 'Colección de arte sacro parroquial que conserva obras de gran valor histórico y artístico.' },
      { time: '16:30', place: 'Centro Cultural Antigua Cárcel (Lecrac)', desc: 'El antiguo edificio carcelario reconvertido en espacio cultural en el centro de Palencia.' },
    ],
  },
  'Salamanca': {
    dia1: [
      { time: '10:00', place: 'Ieronimus (Torres de la Catedral)',    desc: 'Sube a las torres de la catedral para la vista más impresionante de la ciudad dorada al atardecer.', photo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/8b/Salamanca_Cathedral.jpg/800px-Salamanca_Cathedral.jpg' },
      { time: '12:00', place: 'Universidad de Salamanca',             desc: 'La más antigua de España. Busca la rana en la fachada plateresca y descubre las Escuelas Menores.', photo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b6/Salamanca_-_Plaza_Mayor_01.jpg/800px-Salamanca_-_Plaza_Mayor_01.jpg' },
      { time: '16:30', place: 'Catedral Nueva y Vieja',               desc: 'Dos catedrales comunicadas entre sí: gótica y románica. Busca el astronauta tallado en la portada nueva.', photo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/8b/Salamanca_Cathedral.jpg/800px-Salamanca_Cathedral.jpg' },
    ],
    dia2: [
      { time: '11:00', place: 'La Alberca',                           desc: 'Recorrido por uno de los pueblos más bellos de España en la Sierra de Francia, Conjunto Histórico-Artístico.', photo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/6e/La_Alberca.jpg/800px-La_Alberca.jpg' },
      { time: '16:00', place: 'Peña de Francia',                      desc: 'Subida al santuario en la cima a 1.723 m con vistas que abarcan tres provincias en días despejados.', photo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b6/Salamanca_-_Plaza_Mayor_01.jpg/800px-Salamanca_-_Plaza_Mayor_01.jpg' },
    ],
    dia3: [
      { time: '10:00', place: 'Basílica de Santa Teresa (Alba de Tormes)', desc: 'Basílica construida sobre el lugar donde murió Santa Teresa de Jesús en Alba de Tormes.' },
      { time: '12:30', place: 'Castillo de los Duques de Alba',       desc: 'Impresionante castillo medieval en Alba de Tormes, sede histórica de la Casa de Alba.' },
      { time: '16:30', place: 'Museo de Historia de la Automoción',   desc: 'Singular museo en Salamanca con una de las mejores colecciones de automóviles históricos de España.' },
    ],
    dia4: [
      { time: '10:00', place: 'Puerta Ciudad Rodrigo', desc: 'Palacio renacentista en Ciudad Rodrigo, una de las ciudades amuralladas mejor conservadas de España.' },
      { time: '12:30', place: 'Centro de Interpretación de la Ruta de las Fortificaciones de Frontera', desc: 'Las líneas defensivas que marcaron la frontera hispano-portuguesa durante siglos.' },
      { time: '16:30', place: 'Museo de Arte Oriental',                  desc: 'Excepcional colección de arte oriental en el convento de los Agustinos de Salamanca.' },
    ],
    dia5: [
      { time: '10:00', place: 'Casa del Parque Arribes del Duero',    desc: 'Centro de interpretación de los espectaculares cañones del Duero en la frontera con Portugal.' },
      { time: '13:30', place: 'Espacio Museístico Casa del Conde',    desc: 'Espacio cultural en una casa señorial que recoge el patrimonio etnográfico de la comarca.' },
      { time: '16:30', place: 'Museo Etnográfico del Lino',           desc: 'El cultivo y transformación del lino, una tradición centenaria de la sierra salmantina.' },
    ],
    dia6: [
      { time: '10:00', place: 'Museo de la Universidad de Salamanca', desc: 'Las colecciones históricas, artísticas y científicas de la universidad más antigua de España.' },
      { time: '12:30', place: 'Casa de Gabriel y Galán',              desc: 'Casa museo del poeta extremeño Gabriel y Galán en Frades de la Sierra.' },
      { time: '16:30', place: 'Museo Etnográfico (Navasfrías)',       desc: 'La vida fronteriza entre España y Portugal en este museo en la raya salmantina.' },
    ],
    dia7: [
      { time: '10:00', place: 'Museo de Trajes Típicos',              desc: 'Extraordinaria colección de trajes regionales y bordados tradicionales de Salamanca.' },
      { time: '12:30', place: 'Casa Museo de Zacarías González',      desc: 'Casa museo del pintor salmantino con obras y objetos personales de su vida y obra.' },
      { time: '16:30', place: 'Museo de las Llanuras y Campiñas de Salamanca (Macotera)', desc: 'El paisaje, la fauna y las tradiciones de la campiña salmantina en Macotera.' },
    ],
  },
  'Segovia': {
    dia1: [
      { time: '09:30', place: 'Acueducto Romano',                     desc: 'Paseo por el Postigo. 167 arcos de piedra seca de 2.000 años. Llega temprano para verlo con la luz de la mañana.', photo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/37/Acueducto_de_Segovia_02.jpg/800px-Acueducto_de_Segovia_02.jpg' },
      { time: '11:00', place: 'Catedral de Segovia',                  desc: 'La última catedral gótica construida en España (s.XVI). Su interior es de una serenidad impresionante.', photo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/65/Alcazar_de_Segovia_-_02.jpg/800px-Alcazar_de_Segovia_-_02.jpg' },
      { time: '15:30', place: 'Alcázar de Segovia',                   desc: 'El castillo que inspiró el de Cenicienta. Horario: 10:00-19:00 (verano) / 18:00 (invierno).', photo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/65/Alcazar_de_Segovia_-_02.jpg/800px-Alcazar_de_Segovia_-_02.jpg' },
    ],
    dia2: [
      { time: '10:00', place: 'Palacio Real de La Granja',            desc: 'El Versalles español a 11 km. Horario: 10:00-18:00. Cierra los lunes.', photo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/37/Acueducto_de_Segovia_02.jpg/800px-Acueducto_de_Segovia_02.jpg' },
      { time: '16:00', place: 'Hoces del Río Duratón',                desc: 'Ermita de San Frutos. Parque Natural con cañón espectacular, hogar de buitres leonados.', photo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/d4/Laguna_Negra_de_Urbion.jpg/800px-Laguna_Negra_de_Urbion.jpg' },
    ],
    dia3: [
      { time: '10:00', place: 'Casa-Museo Antonio Machado',           desc: 'La modesta pensión donde vivió el poeta Antonio Machado durante sus años como maestro en Segovia.' },
      { time: '12:00', place: 'Centro Didáctico de la Judería',       desc: 'La historia de la comunidad judía de Segovia en el barrio de la antigua judería medieval.' },
      { time: '16:30', place: 'Museo Zuloaga (filial del Museo de Segovia)', desc: 'Las extraordinarias cerámicas del artista Ignacio Zuloaga en la iglesia románica de San Juan de los Caballeros.' },
    ],
    dia4: [
      { time: '10:00', place: 'Centro Nacional de Educación Ambiental. CENEAM', desc: 'Centro de referencia nacional en educación ambiental, en el Parque Natural de la Sierra de Guadarrama.' },
      { time: '13:00', place: 'Museo de Tapices del Palacio Real de la Granja de San Ildefonso', desc: 'La espectacular colección de tapices flamencos del s.XV al XVIII del Palacio Real de La Granja.' },
      { time: '16:30', place: 'Casa del Parque Sierra Norte de Guadarrama', desc: 'Información sobre el Parque Nacional de la Sierra de Guadarrama y el águila imperial ibérica.' },
    ],
    dia5: [
      { time: '10:00', place: 'Museo Cárcel de la Villa',   desc: 'La antigua cárcel medieval de Pedraza convertida en singular museo en uno de los pueblos más bellos de España.' },
      { time: '13:00', place: 'Centro de Interpretación del Parque Natural de Las Hoces del Río Duratón', desc: 'El cañón del Duratón desde su centro de visitantes en Sepúlveda.' },
      { time: '16:30', place: 'Parque Temático Medieval de San Esteban', desc: 'Recreación de la vida medieval en el entorno del castillo de San Esteban de Gormaz.' },
    ],
    dia6: [
      { time: '10:00', place: 'Casa de Juan Bravo. Casa del Siglo XV', desc: 'La casa del héroe comunero Juan Bravo en Segovia, con arquitectura gótico-plateresca.' },
      { time: '12:30', place: 'Museo de Segovia',                     desc: 'El museo provincial con las colecciones arqueológicas, artísticas e históricas de Segovia.' },
      { time: '16:30', place: 'Sala de Exposiciones del Palacio Quintanar', desc: 'Palacio barroco del s.XVII reconvertido en espacio cultural y de exposiciones en Segovia.' },
    ],
    dia7: [
      { time: '10:00', place: 'Centro de Interpretación de los Encierros', desc: 'Los encierros de Cuéllar son los más antiguos documentados de España, anteriores a los de Pamplona.' },
      { time: '12:30', place: 'Iglesia de San Andrés (Cuéllar)',      desc: 'Iglesia románica del s.XII en Cuéllar, uno de los templos medievales mejor conservados de la provincia.' },
      { time: '16:30', place: 'Alcázar de Segovia / Museo de Armas',  desc: 'El Museo de Armas del Alcázar, con una de las mejores colecciones de armamento histórico de España.' },
    ],
  },
  'Soria': {
    dia1: [
      { time: '10:00', place: 'Claustro de San Juan de Duero',        desc: 'El claustro más original del románico español: arcos entrelazados únicos. Horario: 10:00-14:00 y 16:00-19:00.', photo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b2/Claustro_San_Juan_de_Duero.jpg/800px-Claustro_San_Juan_de_Duero.jpg' },
      { time: '12:00', place: 'Concatedral de San Pedro',             desc: 'El claustro románico es uno de los más bellos de España. Antonio Machado enseñó francés en esta ciudad.', photo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/3f/Soria_-_Catedral_de_San_Pedro_01.jpg/800px-Soria_-_Catedral_de_San_Pedro_01.jpg' },
      { time: '17:00', place: 'Ermita de San Saturio',                desc: 'Pegada a la roca sobre el Duero, esta ermita del s.XVIII es la imagen más fotogénica y espiritual de Soria.', photo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/d6/Ermita_San_Saturio_Soria.jpg/800px-Ermita_San_Saturio_Soria.jpg' },
    ],
    dia2: [
      { time: '10:00', place: 'Laguna Negra',                         desc: 'Acceso regulado por aforo. Lago glaciar en un pinar de ensueño, escenario favorito de los fotógrafos.', photo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/d4/Laguna_Negra_de_Urbion.jpg/800px-Laguna_Negra_de_Urbion.jpg' },
      { time: '16:00', place: 'Ruinas de Numancia (Garray)',          desc: 'El yacimiento celtíbero que resistió a Roma. Un lugar cargado de historia y silencio impresionantes.', photo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/3f/Soria_-_Catedral_de_San_Pedro_01.jpg/800px-Soria_-_Catedral_de_San_Pedro_01.jpg' },
    ],
    dia3: [
      { time: '10:00', place: 'Museo Numantino de Soria',             desc: 'El mejor museo arqueológico de la Meseta Norte, con los hallazgos de Numancia y otros yacimientos sorianos.' },
      { time: '12:30', place: 'Casa del Parque Laguna Negra y Circos Glaciares de Urbión', desc: 'Centro de interpretación del espacio natural de la Laguna Negra en Vinuesa.' },
      { time: '16:30', place: 'Museo de la Resina',                   desc: 'Singular museo en Coca dedicado a la historia de la resinación, una industria centenaria de los pinares.' },
    ],
    dia4: [
      { time: '10:00', place: 'Centro de Interpretación del Parque Natural del Cañón del Río Lobos', desc: 'El impresionante cañón del Río Lobos con la ermita románica de San Bartolomé en su interior.' },
      { time: '13:30', place: 'Ermita de San Baudelio (Anexo del Museo Numantino)', desc: 'La ermita mozárabe de San Baudelio, una joya del arte hispánico con pinturas únicas.' },
      { time: '16:30', place: 'Medinaceli DeArte - Centro de Arte Contemporáneo', desc: 'Arte contemporáneo en el espectacular conjunto monumental de Medinaceli, sobre la meseta.' },
    ],
    dia5: [
      { time: '10:00', place: 'Museo Monográfico de Tiermes (Filial del Museo Numantino de Soria)',         desc: 'El fascinante yacimiento de Tiermes, ciudad rupestre celtíbero-romana excavada en la roca.' },
      { time: '13:30', place: 'Museo de Arte Sacro de San Esteban de Gormaz. Iglesia de San Miguel', desc: 'Colección de arte sacro en la iglesia de San Miguel de San Esteban de Gormaz.' },
      { time: '16:30', place: 'Centro Visitantes de la Ruta de los Torreones', desc: 'Los torreones medievales del Cañón del Duero, centinelas de piedra sobre el río.' },
    ],
    dia6: [
      { time: '10:00', place: 'Museo Etnográfico de San Andrés',      desc: 'La vida tradicional en los pueblos sorianos recogida en este museo etnográfico comarcal.' },
      { time: '13:00', place: 'Museo Antropológico de Ólvega. José Escribano Calvo',        desc: 'Colección antropológica y etnográfica del entorno del Moncayo en Ólvega.' },
      { time: '16:30', place: 'Museo de Arte Sacro de Yanguas',       desc: 'Arte sacro medieval en Yanguas, villa amurallada de la sierra soriana.' },
    ],
    dia7: [
      { time: '10:00', place: 'Palacio de los Castejón (Ágreda)',     desc: 'Palacio renacentista en Ágreda, villa fronteriza a los pies del Moncayo.' },
      { time: '12:30', place: 'Museo Municipal de San Leonardo de Yagüe', desc: 'Historia y etnografía de las tierras sorianas del Valle del Arlanza.' },
      { time: '16:30', place: 'Centro Cultural Gaya Nuño',            desc: 'Centro dedicado al crítico de arte burgalés Juan Antonio Gaya Nuño, gran estudioso del patrimonio soriano.' },
    ],
  },
  'Valladolid': {
    dia1: [
      { time: '10:00', place: 'Museo Nacional de Escultura',          desc: 'El mejor museo de escultura policromada del mundo. Horario: 10:00-14:00 y 16:00-19:30.', photo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/8a/Iglesia_de_San_Pablo%2C_Valladolid%2C_Espa%C3%B1a%2C_2016-01-08%2C_DD_90.JPG/800px-Iglesia_de_San_Pablo%2C_Valladolid%2C_Espa%C3%B1a%2C_2016-01-08%2C_DD_90.JPG' },
      { time: '12:30', place: 'Iglesia de San Pablo',                 desc: 'La fachada isabelina de San Pablo es una de las más elaboradas del arte español. Visita obligatoria.', photo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/8a/Iglesia_de_San_Pablo%2C_Valladolid%2C_Espa%C3%B1a%2C_2016-01-08%2C_DD_90.JPG/800px-Iglesia_de_San_Pablo%2C_Valladolid%2C_Espa%C3%B1a%2C_2016-01-08%2C_DD_90.JPG' },
      { time: '17:00', place: 'Casa de Cervantes',                    desc: 'Aquí escribió la segunda parte del Quijote. Una casa del s.XVII que te traslada al Siglo de Oro español.', photo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/8a/Iglesia_de_San_Pablo%2C_Valladolid%2C_Espa%C3%B1a%2C_2016-01-08%2C_DD_90.JPG/800px-Iglesia_de_San_Pablo%2C_Valladolid%2C_Espa%C3%B1a%2C_2016-01-08%2C_DD_90.JPG' },
    ],
    dia2: [
      { time: '11:00', place: 'Castillo de Peñafiel',                 desc: 'El castillo-barco sobre la roca con el Museo del Vino. Horario: 10:30-14:00 y 16:00-18:00/19:00.', photo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/3e/Castillo_de_Pe%C3%B1afiel.jpg/800px-Castillo_de_Pe%C3%B1afiel.jpg' },
      { time: '16:30', place: 'Urueña — Villa del Libro',             desc: 'Pueblo amurallado con más librerías por habitante que ningún otro lugar de España.', photo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/3e/Castillo_de_Pe%C3%B1afiel.jpg/800px-Castillo_de_Pe%C3%B1afiel.jpg' },
    ],
    dia3: [
      { time: '10:00', place: 'Casas del Tratado (Tordesillas)',      desc: 'Tordesillas, donde se firmó el Tratado que repartió el mundo entre España y Portugal en 1494.' },
      { time: '12:30', place: 'Palacio Real (Valladolid)',            desc: 'El Palacio Real de Valladolid, donde Carlos I pasó su infancia y Felipe II nació.' },
      { time: '16:30', place: 'Casa Museo de José Zorrilla',          desc: 'La casa natal del poeta romántico creador de Don Juan Tenorio en el centro de Valladolid.' },
    ],
    dia4: [
      { time: '10:00', place: 'Palacio de los Dueñas (Medinal del Campo)', desc: 'El castillo de La Mota en Medina del Campo, donde murió Isabel la Católica.' },
      { time: '12:30', place: 'Fundación Museo de las Ferias',        desc: 'Historia de las legendarias ferias de Medina del Campo, las más importantes de Europa en el s.XV.' },
      { time: '16:30', place: 'Museo de la Ciencia de Valladolid',    desc: 'Interactivo museo de la ciencia en Valladolid, ideal para todas las edades.' },
    ],
    dia5: [
      { time: '10:00', place: 'Castillo de Fuensaldaña (Fuensaldaña)', desc: 'Castillo del s.XV en perfecto estado de conservación, sede histórica de las Cortes de Castilla y León.' },
      { time: '12:30', place: 'Museo Provincial del Vino', desc: 'El vino de la Ribera del Duero explicado dentro del propio Castillo de Peñafiel.' },
      { time: '16:30', place: 'Centro e-LEA Miguel Delibes (Urueña)', desc: 'Centro de lectura en la Villa del Libro dedicado al escritor vallisoletano Miguel Delibes.' },
    ],
    dia6: [
      { time: '10:00', place: 'Iglesia de Santa María',               desc: 'Iglesia románica de Santa María la Antigua, el templo más antiguo de Valladolid.' },
      { time: '12:30', place: 'Sala Municipal de Exposiciones del Museo de la Pasión', desc: 'La imaginería procesional vallisoletana, una de las tradiciones más arraigadas de la Semana Santa española.' },
      { time: '16:30', place: 'Museo de Arte Sacro de Cuenca de Campos', desc: 'Colección de arte sacro en Cuenca de Campos, en plena Tierra de Campos vallisoletana.' },
    ],
    dia7: [
      { time: '10:00', place: 'Casa de Cultura - Iglesia de Santa María (Villalar de los Comuneros)', desc: 'Villalar, donde fueron decapitados los comuneros en 1521, símbolo de Castilla y León.' },
      { time: '13:00', place: 'Complejo PRAE. Centro de Recursos Ambientales (Valladolid)', desc: 'Centro de educación ambiental en Valladolid para conocer los ecosistemas de la comunidad.' },
      { time: '16:30', place: 'Museo y Centro didáctico del Encaje de Castilla y León', desc: 'El encaje de bolillos castellano en este museo único dedicado al arte del encaje en Castilla y León.' },
    ],
  },
  'Zamora': {
    dia1: [
      { time: '10:00', place: 'Catedral de Zamora',                   desc: 'El cimborrio gallonado bizantino es único en España. Horario: 10:00-14:00 y 17:00-20:00 (verano).', photo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/ab/Catedral_de_Zamora_-_Fachada_lateral_y_c%C3%BAbmulo_gallonado.jpg/800px-Catedral_de_Zamora_-_Fachada_lateral_y_c%C3%BAbmulo_gallonado.jpg' },
      { time: '12:00', place: 'Castillo de Zamora y Baltasar Lobo',   desc: 'Visita al castillo sobre el Duero y al espacio escultórico dedicado al artista zamorano Baltasar Lobo.', photo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/ab/Catedral_de_Zamora_-_Fachada_lateral_y_c%C3%BAbmulo_gallonado.jpg/800px-Catedral_de_Zamora_-_Fachada_lateral_y_c%C3%BAbmulo_gallonado.jpg' },
      { time: '17:00', place: 'Ruta del Románico',                    desc: 'San Juan de Puerta Nueva, Santiago del Burgo y más de una decena de iglesias románicas en un radio de 500 m.' },
    ],
    dia2: [
      { time: '11:00', place: 'Monasterio de Santa María de Moreruela', desc: 'Las ruinas del primer monasterio cisterciense de España, de una belleza melancólica única.', photo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/ab/Catedral_de_Zamora_-_Fachada_lateral_y_c%C3%BAbmulo_gallonado.jpg/800px-Catedral_de_Zamora_-_Fachada_lateral_y_c%C3%BAbmulo_gallonado.jpg' },
      { time: '16:00', place: 'Puebla de Sanabria',                   desc: 'Castillo y conjunto histórico medieval en perfecto estado, encaramado junto al río Tera.', photo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/ab/Catedral_de_Zamora_-_Fachada_lateral_y_c%C3%BAbmulo_gallonado.jpg/800px-Catedral_de_Zamora_-_Fachada_lateral_y_c%C3%BAbmulo_gallonado.jpg' },
    ],
    dia3: [
      { time: '10:00', place: 'Museo Etnográfico de Castilla y León', desc: 'Uno de los mejores museos etnográficos de Europa, con la vida tradicional castellana reconstruida.' },
      { time: '12:30', place: 'Museo de Semana Santa',                desc: 'Los pasos procesionales zamoranos, considerados los más bellos de España por su expresividad.' },
      { time: '16:30', place: 'Iglesia del Santo Sepulcro (Toro)',    desc: 'Iglesia románica del s.XII en Toro con una portada de gran riqueza escultórica.' },
    ],
    dia4: [
      { time: '10:00', place: 'Castillo de Puebla de Sanabria',       desc: 'Castillo del s.XV que domina el conjunto histórico de Puebla de Sanabria y el lago glaciar.' },
      { time: '12:30', place: 'Museo Diocesano de Zamora',            desc: 'Colección de arte sacro de la diócesis zamorana, con piezas medievales de excepcional valor.' },
      { time: '16:30', place: 'Museo de Arqueología y Alfarería',     desc: 'La tradición alfarera de Zamora en este museo que recoge el trabajo de los maestros ceramistas.' },
    ],
    dia5: [
      { time: '10:00', place: 'Centro de Interpretación El Alcornocal', desc: 'Los alcornoques y el corcho en el entorno del embalse de Ricobayo en Zamora.' },
      { time: '13:00', place: 'Colección museográfica de los Campamentos Romanos de Petavonium', desc: 'Los campamentos militares romanos de Petavonium en Rosinos de Vidriales.' },
      { time: '16:30', place: 'Museo Etnográfico de Rabanales',       desc: 'Etnografía de la comarca de Aliste en Rabanales, frontera con Portugal.' },
    ],
    dia6: [
      { time: '10:00', place: 'Iglesia-Museo de San Sebastián de los Caballeros', desc: 'Singular iglesia-museo en Toro con una colección de arte sacro de gran valor.' },
      { time: '12:30', place: 'Museo de Baltasar Lobo',               desc: 'La obra del escultor zamorano Baltasar Lobo, discípulo de Picasso, en el corazón de Zamora.' },
      { time: '16:30', place: 'Museo Etnográfico Las Raíces Codesal', desc: 'La vida rural de la comarca de Carballeda en este pequeño pero completo museo etnográfico.' },
    ],
    dia7: [
      { time: '10:00', place: 'Centro Cultural Convento San Francisco (Alcañices)', desc: 'Convento franciscano del s.XIII reconvertido en centro cultural en Alcañices, capital de Aliste.' },
      { time: '13:00', place: 'Fundación González-Allende',           desc: 'Fundación cultural zamorana dedicada a la preservación y difusión del patrimonio local.' },
      { time: '16:30', place: 'Plaza de la Catedral (Zamora)',        desc: 'El corazón monumental de Zamora, rodeado por la catedral, el palacio episcopal y el castillo.' },
    ],
  },
}

// ============================================================
// ITINERARIOS TEMÁTICOS AMPLIADOS
// Permiten al sistema de gustos elegir lugares más afines.
// Cada entrada tiene: time, place, desc, cat (para scoring), photo (opcional)
// cats: monumentos | museos | naturaleza | gastro | religioso | teatro | pueblos
// ============================================================
const dayPlansExtra = {

  // ── ÁVILA ──────────────────────────────────────────────────────────────
  'Ávila': {
    gastro: [
      { time: '13:00', place: 'Restaurante El Fogón de Santa Teresa', cat: 'gastronomia', desc: 'Cocina tradicional abulense: judías del Barco, chuletillas y los famosos yemas de Santa Teresa de postre.' },
      { time: '20:00', place: 'Mercado Grande (tapas)',               cat: 'gastronomia', desc: 'Paseo por los bares del casco histórico degustando patatas revolconas y morcilla serrana.' },
      { time: '11:00', place: 'Bodega El Lagar de Gredos',           cat: 'gastronomia', desc: 'Cata de vinos de la D.O. Cebreros en plena Sierra de Gredos, con maridaje de quesos locales.' },
    ],
    naturaleza: [
      { time: '09:00', place: 'Ruta del Calvitero (Béjar)',          cat: 'naturaleza', desc: 'Ascenso al pico más alto del Sistema Central a 2.401 m. Vistas hacia Extremadura y Salamanca.' },
      { time: '10:00', place: 'Laguna Grande de Gredos',            cat: 'naturaleza', desc: 'El circo glaciar más espectacular de la Sierra de Gredos. Acceso desde el Refugio Elola.' },
      { time: '16:00', place: 'Reserva Natural del Valle de Iruelas',cat: 'naturaleza', desc: 'Hogar del buitre negro ibérico. Rutas de senderismo entre pinos y encinas milenarios.' },
    ],
    pueblos: [
      { time: '10:00', place: 'Madrigal de las Altas Torres',       cat: 'historia', desc: 'Villa amurallada cuna de Isabel la Católica. Murallas mudéjares de tierra y el convento donde nació la reina.' },
      { time: '11:30', place: 'Arévalo',                            cat: 'historia', desc: 'Conjunto histórico castellano con plaza porticada, castillo sobre el río y 33 iglesias románicas.' },
      { time: '16:00', place: 'Mombeltrán',                         cat: 'historia', desc: 'Medieval villa en el Valle del Tiétar con castillo del Duque de Alba dominando el paso de la sierra.' },
    ],
    teatro: [
      { time: '19:00', place: 'Teatro Gran Cine Ávila',             cat: 'teatro', desc: 'Principal espacio escénico de la ciudad. Programación de teatro, ópera y música clásica.' },
      { time: '21:00', place: 'Festival Medieval de Ávila (agosto)',cat: 'teatro', desc: 'El casco histórico se transforma cada agosto en escenario de espectáculos medievales y mercados de época.' },
    ],
  },

  // ── BURGOS ─────────────────────────────────────────────────────────────
  'Burgos': {
    gastro: [
      { time: '13:30', place: 'Mercado del Carrillo (Burgos)',      cat: 'gastronomia', desc: 'Gastromercado en el corazón de Burgos: morcilla, queso de Burgos, lechazo y vinos de la Ribera del Duero.' },
      { time: '11:00', place: 'Bodegas Peñalba López (Aranda)',     cat: 'gastronomia', desc: 'Bodegas del s.XIV excavadas en roca bajo Aranda de Duero. Cata de Ribera del Duero con asado de lechazo.' },
      { time: '20:30', place: 'Barrio de San Juan (tapeo)',          cat: 'gastronomia', desc: 'Ruta de pinchos por el barrio más animado de Burgos. Morcilla con piñones, queso y tostas de jamón.' },
    ],
    naturaleza: [
      { time: '09:30', place: 'Parque Natural Hoces del Alto Ebro', cat: 'naturaleza', desc: 'Espectacular cañón del Ebro en su nacimiento. Buitres leonados, orquídeas silvestres y pueblos rupestres.' },
      { time: '10:00', place: 'Laguna de Sotillo (Lagunas de Neila)',cat: 'naturaleza', desc: 'Lagunas glaciares en los Picos de Urbión. Paisajes alpinos únicos en la Serranía Suroriental.' },
      { time: '15:00', place: 'Cañón del Río Arlanza',             cat: 'naturaleza', desc: 'Senderismo entre monasterios medievales y cortados de roca caliza en plena Castilla.' },
    ],
    pueblos: [
      { time: '10:00', place: 'Covarrubias',                        cat: 'historia', desc: 'Villa medieval con torre mudéjar del s.X, colegiata y las tumbas de los primeros Condes de Castilla.' },
      { time: '11:30', place: 'Lerma',                              cat: 'historia', desc: 'Conjunto barroco del duque de Lerma, valido de Felipe III. Plaza ducal y convento-parador.' },
      { time: '16:00', place: 'Frías',                              cat: 'historia', desc: 'El pueblo más bonito de Burgos. Castillo roquero sobre el Ebro y arco medieval con casas encimadas.' },
    ],
    teatro: [
      { time: '19:30', place: 'Teatro Principal de Burgos',         cat: 'teatro', desc: 'El más veterano de Castilla, con temporada de ópera, ballet y teatro clásico en un edificio neoclásico.' },
      { time: '20:00', place: 'Festival de Música Medieval de Burgo Osma', cat: 'teatro', desc: 'Festival de música antigua y medieval en el espectacular conjunto catedralicio de El Burgo de Osma.' },
    ],
  },

  // ── LEÓN ───────────────────────────────────────────────────────────────
  'León': {
    gastro: [
      { time: '13:30', place: 'Barrio Húmedo de León',              cat: 'gastronomia', desc: 'El tapeo más famoso de España. Cada caña viene con su tapa gratuita: cecina, botillo, lacón o morcilla.' },
      { time: '11:00', place: 'D.O. Bierzo - Bodega Palacios Remondo', cat: 'gastronomia', desc: 'Enoturismo en el Bierzo. La mención cata de Mencía entre viñedos de pizarra y castaños centenarios.' },
      { time: '20:30', place: 'Barrio Romántico de León (tapeo)',   cat: 'gastronomia', desc: 'Calle Ancha y alrededores: bacalao al ajoarriero, pimientos del Bierzo y queso de Valdeón.' },
    ],
    naturaleza: [
      { time: '09:00', place: 'Picos de Europa (Posada de Valdeón)', cat: 'naturaleza', desc: 'La vertiente leonesa del Parque Nacional. Ruta a los Lagos de Covadonga desde el Puerto del Pontón.' },
      { time: '10:00', place: 'Hoces de Vegacervera',               cat: 'naturaleza', desc: 'Impresionante desfiladero de caliza en la montaña leonesa, con puentes romanos y fauna rapaz.' },
      { time: '15:30', place: 'Lago de Sanabria (desde León)',      cat: 'naturaleza', desc: 'El lago glaciar más grande de la Península Ibérica, en el límite con Zamora. Aguas cristalinas.' },
    ],
    pueblos: [
      { time: '10:00', place: 'Castrillo de los Polvazares',        cat: 'historia', desc: 'Pueblo de arriero maragato declarado Conjunto Histórico. Adoquines centenarios y cocido maragato.' },
      { time: '11:30', place: 'Molinaseca',                         cat: 'historia', desc: 'Medieval villa templaria en el Camino de Santiago del Bierzo, junto al río Meruelo.' },
      { time: '16:00', place: 'Puebla de Sanabria',                 cat: 'historia', desc: 'Castillo medieval y conjunto histórico en el extremo occidental de la provincia zamorana.' },
    ],
    teatro: [
      { time: '20:00', place: 'Auditorio Ciudad de León',           cat: 'teatro', desc: 'Espacio para conciertos sinfónicos, ópera y grandes espectáculos en un moderno auditorio.' },
      { time: '19:30', place: 'Teatro de San Francisco (León)',     cat: 'teatro', desc: 'El teatro más clásico de León con programación de teatro, zarzuela y música en vivo.' },
    ],
  },

  // ── PALENCIA ───────────────────────────────────────────────────────────
  'Palencia': {
    gastro: [
      { time: '13:30', place: 'Restaurante Casa Lucio (Palencia)',  cat: 'gastronomia', desc: 'Cocina palentina clásica: menestra de verduras de Tierra de Campos, lechazo al horno y torreznos.' },
      { time: '11:00', place: 'Bodega Valdecuevas (Cigales)',       cat: 'gastronomia', desc: 'Enoturismo en la D.O. Cigales, conocida por sus rosados. Bodega con viñedos a 850 m de altitud.' },
      { time: '12:30', place: 'Quesos de Cervera de Pisuerga',     cat: 'gastronomia', desc: 'Los queserías artesanales de la Montaña Palentina elaboran quesos de oveja churra únicos.' },
    ],
    naturaleza: [
      { time: '09:00', place: 'Parque Natural Fuentes Carrionas',  cat: 'naturaleza', desc: 'El corazón verde de la Montaña Palentina. Osos pardos, rebecos y urogallos en sus valles.' },
      { time: '10:00', place: 'Canal de Castilla (ruta en bici)',  cat: 'naturaleza', desc: '100 km de vía verde junto al canal ilustrado del s.XVIII entre esclusas y molinos de harina.' },
      { time: '16:00', place: 'Hoces de Valverde de Campos',      cat: 'naturaleza', desc: 'Espectaculares hoces del Pisuerga con colonias de buitres leonados y aves esteparias.' },
    ],
    pueblos: [
      { time: '10:00', place: 'Aguilar de Campoo',                 cat: 'historia', desc: 'La capital del románico palentino: Colegiata, castillo, monasterios y una villa medieval perfecta.' },
      { time: '11:30', place: 'Cervera de Pisuerga',               cat: 'historia', desc: 'Capital de la Montaña Palentina, con un espectacular embalse y el Parque Natural más virgen.' },
      { time: '16:00', place: 'Astudillo',                         cat: 'historia', desc: 'Villa amurallada con convento de Santa Clara, uno de los mejores conjuntos medievales de la meseta.' },
    ],
    teatro: [
      { time: '20:00', place: 'Teatro Principal de Palencia',      cat: 'teatro', desc: 'Temporada de teatro, música y danza en el teatro más emblemático de la ciudad.' },
      { time: '19:00', place: 'Festival Internacional de Órgano de Palencia', cat: 'teatro', desc: 'Festival anual con recitales en la Catedral y los templos románicos de la provincia.' },
    ],
  },

  // ── SALAMANCA ──────────────────────────────────────────────────────────
  'Salamanca': {
    gastro: [
      { time: '13:30', place: 'Mercado Central de Salamanca',      cat: 'gastronomia', desc: 'El mercado más bonito de Castilla: jamón ibérico de Guijuelo, queso y los famosos hornazo salmantino.' },
      { time: '12:00', place: 'Bodega Hacienda Zorita (Valverdón)',cat: 'gastronomia', desc: 'Enoturismo en el río Tormes. Vinos ecológicos, olivos centenarios y cata con productos locales.' },
      { time: '20:30', place: 'Plaza Mayor (tapeo nocturno)',      cat: 'gastronomia', desc: 'La plaza barroca más bella de España. Tapas en los bares del entorno: farinato, caldo de castañas.' },
    ],
    naturaleza: [
      { time: '09:30', place: 'Arribes del Duero (Fermoselle)',    cat: 'naturaleza', desc: 'Los cañones del Duero: 200 m de profundidad, buitres leonados y viñas en terrazas de pizarra.' },
      { time: '10:00', place: 'Sierra de Francia (Las Batuecas)',  cat: 'naturaleza', desc: 'El valle más aislado de España. Pinturas rupestres, buitres negros y bosques mediterráneos.' },
      { time: '15:00', place: 'Laguna de Béjar',                  cat: 'naturaleza', desc: 'Pequeño lago glaciar en el macizo de Béjar con rutas de senderismo por el Sistema Central.' },
    ],
    pueblos: [
      { time: '10:00', place: 'La Alberca',                       cat: 'historia', desc: 'Primer Conjunto Histórico-Artístico de España. Casas entramadas y ermitas en la Sierra de Francia.' },
      { time: '11:30', place: 'Miranda del Castañar',             cat: 'historia', desc: 'Villa medieval amurallada en la Sierra de Francia con uno de los cascos históricos más intactos.' },
      { time: '16:00', place: 'Ledesma',                          cat: 'historia', desc: 'Ciudad amurallada sobre el Tormes con plaza renacentista y aguas termales de fama histórica.' },
    ],
    teatro: [
      { time: '20:30', place: 'Teatro Liceo de Salamanca',        cat: 'teatro', desc: 'Teatro neoclásico del s.XIX con una de las mejores programaciones de España: ópera, jazz y flamenco.' },
      { time: '19:30', place: 'Festival de las Artes de Salamanca',cat: 'teatro', desc: 'Festival cultural en julio-agosto con espectáculos al aire libre en el Huerto de Calixto y Melibea.' },
    ],
  },

  // ── SEGOVIA ────────────────────────────────────────────────────────────
  'Segovia': {
    gastro: [
      { time: '13:30', place: 'Mesón de Cándido (Segovia)',        cat: 'gastronomia', desc: 'El restaurante más emblemático del cochinillo segoviano, bajo el Acueducto desde 1884.' },
      { time: '11:00', place: 'Bodega Viñedos de Nieva (Nieva)',  cat: 'gastronomia', desc: 'Los mejores Rueda blancos junto al Duero. Cata de Verdejo con quesos de oveja de la zona.' },
      { time: '12:30', place: 'Mercado Medieval de Pedraza',      cat: 'gastronomia', desc: 'Productos artesanales del entorno: miel, quesos, embutidos y el famoso lechazo de Pedraza.' },
    ],
    naturaleza: [
      { time: '09:00', place: 'Sierra de Guadarrama (La Pedriza)', cat: 'naturaleza', desc: 'Parque Nacional con caos graníticos únicos. Cabras montesas, águilas reales y ruta al Yelmo.' },
      { time: '10:00', place: 'Hayedo de Riaza',                  cat: 'naturaleza', desc: 'El hayedo más meridional de Europa en otoño: un espectáculo de colores en la sierra de Ayllón.' },
      { time: '15:30', place: 'Hoces del Duratón',                cat: 'naturaleza', desc: 'Parque Natural con mayor colonia de buitres leonados de Europa. Kayak por el cañón.' },
    ],
    pueblos: [
      { time: '10:00', place: 'Pedraza',                          cat: 'historia', desc: 'El pueblo medieval mejor conservado de Castilla. Castillo, plaza porticada y un silencio de otro siglo.' },
      { time: '11:30', place: 'Sepúlveda',                        cat: 'historia', desc: 'Villa románica sobre el Duratón con siete iglesias del s.XI-XII y un casco histórico impresionante.' },
      { time: '16:00', place: 'Turégano',                         cat: 'historia', desc: 'Castillo episcopal fusionado con la iglesia de San Juan: una rareza arquitectónica única en España.' },
    ],
    teatro: [
      { time: '20:00', place: 'Teatro Juan Bravo (Segovia)',      cat: 'teatro', desc: 'El principal teatro de Segovia con temporada de teatro, danza y música en un bello edificio histórico.' },
      { time: '22:00', place: 'Noche en las Velas de Pedraza',   cat: 'teatro', desc: 'Festival de julio: el pueblo se ilumina solo con velas mientras suenan los Conciertos de la Música Callada.' },
    ],
  },

  // ── SORIA ──────────────────────────────────────────────────────────────
  'Soria': {
    gastro: [
      { time: '13:00', place: 'Restaurante Virrey Palafox (El Burgo de Osma)', cat: 'gastronomia', desc: 'Cocina soriana de prestigio: sopa castellana, judiones de la Granja y lechazo de Castilla.' },
      { time: '11:00', place: 'Bodega Castillo de Castañeda (Morales)',cat: 'gastronomia', desc: 'D.O. Ribera del Duero en su cuna soriana. Cata de crianzas y reservas en bodega histórica.' },
      { time: '20:30', place: 'Calle del Collado (tapeo soria)',  cat: 'gastronomia', desc: 'La calle más animada de Soria: pincho de morcilla, hongos de temporada y migas pastoriles.' },
    ],
    naturaleza: [
      { time: '09:00', place: 'Cañón del Río Lobos',             cat: 'naturaleza', desc: 'Parque Natural con el templo rupestre de San Bartolomé y colonias de buitres leonados.' },
      { time: '10:00', place: 'Laguna Negra y Circos de Urbión', cat: 'naturaleza', desc: 'Acceso regulado al lago glaciar más fotogénico de Castilla, rodeado de pinos centenarios.' },
      { time: '15:30', place: 'Sabinares del Arlanza',           cat: 'naturaleza', desc: 'Bosques de sabinas albares milenarias en el Cañón del Arlanza, un paisaje de otro planeta.' },
    ],
    pueblos: [
      { time: '10:00', place: 'El Burgo de Osma',                cat: 'historia', desc: 'Ciudad episcopal con catedral, castillo y un casco histórico barroco impecable junto al Ucero.' },
      { time: '11:30', place: 'Medinaceli',                      cat: 'historia', desc: 'Sobre la meseta, con el único arco romano de tres vanos conservado en España y un conjunto histórico único.' },
      { time: '16:00', place: 'Berlanga de Duero',               cat: 'historia', desc: 'Castillo del s.XV, colegiata plateresca y muralla: uno de los conjuntos medievales más completos de Soria.' },
    ],
    teatro: [
      { time: '20:00', place: 'Teatro Coliseum (Soria)',         cat: 'teatro', desc: 'El principal espacio cultural de Soria: teatro, ciclos de ópera en versión concierto y música en vivo.' },
      { time: '21:00', place: 'Festival Internacional de Música de Soria', cat: 'teatro', desc: 'Ciclo estival de música clásica con conciertos en el claustro de Santo Domingo de Silos.' },
    ],
  },

  // ── VALLADOLID ─────────────────────────────────────────────────────────
  'Valladolid': {
    gastro: [
      { time: '13:30', place: 'Mercado del Val (Valladolid)',     cat: 'gastronomia', desc: 'El mejor mercado de Castilla en un edificio modernista. Bacalao, lechazo y quesos de Castilla.' },
      { time: '11:00', place: 'Museo del Vino Castilla (Peñafiel)',cat: 'gastronomia', desc: 'En el castillo-barco: cata de Ribera del Duero con maridaje de quesos y charcutería de la zona.' },
      { time: '20:30', place: 'Zona Francisco Suárez (tapeo)',   cat: 'gastronomia', desc: 'El barrio gastronómico de Valladolid. Pinchos creativos, vinos de la Ribera y ambiente universitario.' },
    ],
    naturaleza: [
      { time: '09:30', place: 'Laguna de la Nava (Fuentes de Nava)', cat: 'naturaleza', desc: 'Paraíso ornitológico recuperado: flamencos, ánsares y avutardas en la antigua laguna de la Tierra de Campos.' },
      { time: '10:00', place: 'Montes Torozos',                  cat: 'naturaleza', desc: 'Páramo de encinas y quejigos con ermitas románicas y buitres leonados sobrevolando las dehesas.' },
      { time: '15:00', place: 'Riberas del Duero (Tudela)',      cat: 'naturaleza', desc: 'Senderismo por las riberas del Duero entre álamos y sotos fluviales, con nutrias y martines pescadores.' },
    ],
    pueblos: [
      { time: '10:00', place: 'Urueña',                          cat: 'historia', desc: 'La Villa del Libro: muralla románica intacta y más de 10 librerías especializadas en un pueblo de 200 habitantes.' },
      { time: '11:30', place: 'Peñafiel',                        cat: 'historia', desc: 'El castillo-barco y el casco histórico en la confluencia del Duero y el Duratón. Vino y lechazo.' },
      { time: '16:00', place: 'Tordesillas',                     cat: 'historia', desc: 'Donde se repartió el mundo en 1494. Convento de Santa Clara con el panteón de Doña Juana la Loca.' },
    ],
    teatro: [
      { time: '20:00', place: 'Teatro Calderón de Valladolid',  cat: 'teatro', desc: 'El gran teatro histórico de Valladolid con temporada de ópera, ballet y las mejores compañías nacionales.' },
      { time: '21:00', place: 'SEMINCI (Festival de Cine de Valladolid)', cat: 'teatro', desc: 'Octubre: el festival de cine más antiguo de España, con proyecciones en el Teatro Calderón y el Zorrilla.' },
    ],
  },

  // ── ZAMORA ─────────────────────────────────────────────────────────────
  'Zamora': {
    gastro: [
      { time: '13:30', place: 'Restaurante Serafín (Zamora)',    cat: 'gastronomia', desc: 'Cocina zamorana de referencia: sopa de ajo, manitas de cerdo y los famosos bolos de pan zamorano.' },
      { time: '11:00', place: 'Bodega Vinos de Toro (Morales de Toro)', cat: 'gastronomia', desc: 'D.O. Toro: los vinos más poderosos de Castilla. Cata de Tinta de Toro en bodega centenaria.' },
      { time: '20:30', place: 'Barrio de San Frontis (tapeo)',  cat: 'gastronomia', desc: 'Tradicional barrio zamorano junto al Duero: tapas de bacalao con tomate, boquerones y revueltos.' },
    ],
    naturaleza: [
      { time: '09:00', place: 'Lago de Sanabria',               cat: 'naturaleza', desc: 'El lago glaciar más grande de la Península. Kayak, baño y rutas de senderismo en el Parque Natural.' },
      { time: '10:00', place: 'Arribes del Duero (Fermoselle)', cat: 'naturaleza', desc: 'Cañones de 200 m de profundidad en la frontera con Portugal. Buitres leonados y viñedos en terrazas.' },
      { time: '15:00', place: 'Sierra de la Culebra',           cat: 'naturaleza', desc: 'La mayor concentración de lobo ibérico en Europa. Rutas de avistamiento nocturno en otoño.' },
    ],
    pueblos: [
      { time: '10:00', place: 'Puebla de Sanabria',             cat: 'historia', desc: 'El pueblo de postal del noroeste: castillo medieval sobre el Tera y casco histórico intacto del s.XV.' },
      { time: '11:30', place: 'Toro',                           cat: 'historia', desc: 'La ciudad del románico tardío zamorano: Colegiata de Santa María la Mayor y bodegas centenarias.' },
      { time: '16:00', place: 'Alcañices',                      cat: 'historia', desc: 'Capital de Aliste junto a la raya portuguesa. Torre del Reloj y el tratado que fijó la frontera.' },
    ],
    teatro: [
      { time: '20:00', place: 'Teatro Ramos Carrión (Zamora)', cat: 'teatro', desc: 'El teatro histórico de Zamora con programación de teatro, ópera en versión concierto y flamenco.' },
      { time: '21:00', place: 'Festival de Otoño de Zamora',   cat: 'teatro', desc: 'Ciclo cultural otoñal con espectáculos al aire libre en el Castillo y el Parque de la Marina.' },
    ],
  },
};

// Función helper: combina dayPlans base + extras temáticos según preferencias
function buildEnrichedDayPlans(province, ranking) {
  const base   = dayPlans[province];
  const extras = dayPlansExtra[province];
  if (!base || !extras) return base;

  // Mapa de preferencia → categoria extra
  const prefToCat = {
    gastro:    extras.gastro    || [],
    naturaleza:extras.naturaleza|| [],
    pueblos:   extras.pueblos   || [],
    teatro:    extras.teatro    || [],
    religioso: extras.pueblos   || [],   // fallback a pueblos
    museos:    [],
    monumentos:[],
  };

  // Reúne todos los extras relevantes ordenados por peso del ranking
  const relevantExtras = [];
  ranking.forEach(prefId => {
    const items = prefToCat[prefId] || [];
    items.forEach(item => {
      if (!relevantExtras.find(e => e.place === item.place)) {
        relevantExtras.push(item);
      }
    });
  });

  if (!relevantExtras.length) return base;

  // Intercala extras en los días, distribuyendo equitativamente
  const enriched = {};
  let eIdx = 0;
  for (let d = 1; d <= 7; d++) {
    const key = 'dia' + d;
    if (!base[key]) continue;
    const dayItems = [...base[key]];
    // Insertar hasta 1 extra por día (para no saturar)
    if (eIdx < relevantExtras.length) {
      const extra = { ...relevantExtras[eIdx++] };
      // Asignar hora al final del día
      const lastTime = dayItems[dayItems.length - 1]?.time || '18:00';
      const [h, m] = lastTime.split(':').map(Number);
      const newH = Math.min(h + 2, 21);
      extra.time = `${String(newH).padStart(2,'0')}:${String(m).padStart(2,'0')}`;
      dayItems.push(extra);
    }
    enriched[key] = dayItems;
  }

  return enriched;
}

const provinces = ['León','Zamora','Salamanca','Valladolid','Palencia','Burgos','Ávila','Segovia','Soria'];
const provinceCenters = {
  'León': [42.60, -5.57],
  'Zamora': [41.50, -5.74],
  'Salamanca': [40.96, -5.66],
  'Valladolid': [41.65, -4.72],
  'Palencia': [42.01, -4.53],
  'Burgos': [42.34, -3.70],
  'Ávila': [40.65, -4.69],
  'Segovia': [40.94, -4.11],
  'Soria': [41.76, -2.46],
};

// Iconos de categoría: SVG de trazo (estilo Lucide), heredan el color con currentColor
const _catSvg = inner => '<svg class="cat-ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + inner + '</svg>';
const catIcon = {
  'monumento':   _catSvg('<path d="M22 20v-9H2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2Z"/><path d="M18 11V4H6v7"/><path d="M15 22v-4a3 3 0 0 0-6 0v4"/><path d="M22 11V9M2 11V9M6 4V2M18 4V2M10 4V2M14 4V2"/>'),
  'museo':       _catSvg('<path d="M3 22h18M6 18v-7M10 18v-7M14 18v-7M18 18v-7"/><path d="M12 2l8 5H4z"/>'),
  'biblioteca':  _catSvg('<path d="M12 7v14"/><path d="M3 18a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h5a4 4 0 0 1 4 4 4 4 0 0 1 4-4h5a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1h-6a3 3 0 0 0-3 3 3 3 0 0 0-3-3z"/>'),
  'teatro':      _catSvg('<path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/>'),
  'exposicion':  _catSvg('<rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.1-3.1a2 2 0 0 0-2.8 0L6 21"/>'),
  'cine':        _catSvg('<rect x="2" y="2" width="20" height="20" rx="2.2"/><path d="M7 2v20M17 2v20M2 12h20M2 7h5M2 17h5M17 17h5M17 7h5"/>'),
  'cultura':     _catSvg('<circle cx="13.5" cy="6.5" r=".6"/><circle cx="17.5" cy="10.5" r=".6"/><circle cx="8.5" cy="7.5" r=".6"/><circle cx="6.5" cy="12.5" r=".6"/><path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.9 0 1.6-.7 1.6-1.7 0-.4-.2-.8-.4-1.1-.3-.3-.4-.7-.4-1.1a1.6 1.6 0 0 1 1.7-1.7h2c3 0 5.5-2.5 5.5-5.5C22 6 17.5 2 12 2z"/>'),
  'naturaleza':  _catSvg('<path d="m8 3 4 8 5-5 5 15H2L8 3z"/>'),
  'historia':    _catSvg('<path d="M14.5 17.5 3 6V3h3l11.5 11.5M13 19l6-6M16 16l4 4M19 21l2-2M14.5 6.5 18 3h3v3l-3.5 3.5M5 14l4 4M7 17l-3 3M3 19l2 2"/>'),
  'gastronomia': _catSvg('<path d="M8 22h8M7 10h10M12 15v7"/><path d="M12 15a5 5 0 0 0 5-5c0-2-.5-4-2-8H9c-1.5 4-2 6-2 8a5 5 0 0 0 5 5Z"/>'),
  'alojamiento': _catSvg('<path d="M2 4v16M2 8h18a2 2 0 0 1 2 2v10M2 17h20M6 8v9"/>'),
  'bar':         _catSvg('<path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2M7 2v20M21 15V2a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3Zm0 0v7"/>'),
  'default':     _catSvg('<path d="M20 10c0 5-5.5 10.2-7.4 11.8a1 1 0 0 1-1.2 0C9.5 20.2 4 15 4 10a8 8 0 0 1 16 0"/><circle cx="12" cy="10" r="3"/>')
};

// Corazón de favoritos: contorno si no lo es, relleno terracota si lo es
const favIcon = on => '<svg class="fav-ico' + (on ? ' is-on' : '') + '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M19 14c1.5-1.5 3-3.2 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.8 0-3 .5-4.5 2-1.5-1.5-2.7-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4 3 5.5l7 7Z"/></svg>';

const catLabel = {
  'monumento':   'Monumentos',
  'museo':       'Museos',
  'biblioteca':  'Bibliotecas',
  'teatro':      'Teatros y Música',
  'exposicion':  'Exposiciones',
  'cine':        'Cines',
  'cultura':     'Centros Culturales',
  'naturaleza':  'Naturaleza',
  'historia':    'Historia',
  'gastronomia': 'Gastronomía',
  'alojamiento': 'Alojamientos',
  'bar':         'Bares y Restaurantes',
};


// Fotos genéricas por categoría via Unsplash (se usan solo si el marcador no tiene foto propia)
const catPhoto = {
  'monumento':   'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&q=75',
  'alojamiento': 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=600&q=75',
  'bar':         'https://images.unsplash.com/photo-1514190051997-0f6f39ca5cde?w=600&q=75',
  'museo':      'https://images.unsplash.com/photo-1518998053901-5348d3961a04?w=600&q=75',
  'biblioteca': 'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=600&q=75',
  'teatro':     'https://images.unsplash.com/photo-1507676184212-d03ab07a01bf?w=600&q=75',
  'exposicion': 'https://images.unsplash.com/photo-1536924940846-227afb31e2a5?w=600&q=75',
  'cine':       'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=600&q=75',
  'cultura':    'https://images.unsplash.com/photo-1460661419201-fd4cecdf8a8b?w=600&q=75',
  'naturaleza': 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=600&q=75',
  'historia':   'https://images.unsplash.com/photo-1580537659466-0a9bfa916a54?w=600&q=75',
  'gastronomia':'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=600&q=75',
  'default':    'https://images.unsplash.com/photo-1539037116277-4db20889f2d4?w=600&q=75',
};

function setCatFilter(cat, province) {
  appState.filterCat = cat;
  appState.visibleCards = 8;
  loadProvinceMarkers(province);
}
// ============================================================
// MAPA LEAFLET — inicialización lazy (cuando la sección es visible)
// ============================================================
let map = null;

