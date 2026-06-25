export interface Property {
  id?: number;
  name: string;
  municipality: string;
  referencePoint: string;
  gpsCoordinates: string;
  ownerName: string;
  cpf: string;
  birthDate: string;
  contactPhone: string;
  collaborativeOwner: boolean;
  wifiName: string;
  wifiPass: string;
  residents: string[];
  photos: string[];
  lastPatrol: string;
}

const DB_NAME = "PatrulhaRuralDB";
const DB_VERSION = 1;
const STORE_NAME = "properties";

// Initial seed data matching the UI screenshots, relocated to Seridó Potiguar region
const SEED_PROPERTIES: Property[] = [];
/*
const OLD_SEED_PROPERTIES: Property[] = [
  {
    name: "Fazenda Esperança",
    municipality: "Caicó",
    referencePoint: "Estrada de acesso ao Distrito de Laginhas, KM 12",
    gpsCoordinates: "-6.4521, -37.0945",
    ownerName: "João Batista da Silva",
    cpf: "123.456.789-00",
    birthDate: "1975-04-12",
    contactPhone: "(84) 99999-9999",
    collaborativeOwner: true,
    wifiName: "FazendaEsperanca_GP",
    wifiPass: "esperanca123",
    residents: [
      "João Batista da Silva",
      "Maria Aparecida Silva",
      "Pedro Henrique Silva",
      "Ana Julia Silva"
    ],
    photos: [
      "https://picsum.photos/seed/esperanca/800/600"
    ],
    lastPatrol: "24/06/2026 14:30"
  },
  {
    name: "Fazenda Vale Verde",
    municipality: "Currais Novos",
    referencePoint: "Rodovia BR-226, KM 142, próximo ao posto da PRF",
    gpsCoordinates: "-6.2645, -36.5122",
    ownerName: "Antônio de Pádua",
    cpf: "123.789.456-89",
    birthDate: "1968-08-20",
    contactPhone: "(84) 98888-8888",
    collaborativeOwner: false,
    wifiName: "ValeVerde_Wifi",
    wifiPass: "verde9876",
    residents: [
      "Antônio de Pádua",
      "Gisela de Pádua"
    ],
    photos: [
      "https://picsum.photos/seed/valeverde/800/600"
    ],
    lastPatrol: "20/06/2026 09:15"
  },
  {
    name: "Sítio Recanto Feliz",
    municipality: "Acari",
    referencePoint: "Vicinal de Gargalheiras, KM 3, entrada à esquerda após a igrejinha",
    gpsCoordinates: "-6.4312, -36.6355",
    ownerName: "Maria Silva",
    cpf: "456.123.789-11",
    birthDate: "1982-11-05",
    contactPhone: "(84) 97777-7777",
    collaborativeOwner: true,
    wifiName: "Recanto_Net",
    wifiPass: "feliz2026",
    residents: [
      "Maria Silva",
      "Julia Silva (Filha)"
    ],
    photos: [
      "https://picsum.photos/seed/recanto/800/600"
    ],
    lastPatrol: "22/06/2026 16:45"
  },
  {
    name: "Sítio Mandacaru",
    municipality: "Currais Novos",
    referencePoint: "Estrada da Mina Brejuí, KM 5, porteira de ferro azul",
    gpsCoordinates: "-6.2514, -36.5298",
    ownerName: "Francisco de Assis Santos",
    cpf: "234.567.890-12",
    birthDate: "1960-03-24",
    contactPhone: "(84) 98765-4321",
    collaborativeOwner: true,
    wifiName: "Sitiomandacaru_WIFI",
    wifiPass: "mandacaru2026",
    residents: ["Francisco de Assis Santos", "Antônia Maria Santos"],
    photos: ["https://picsum.photos/seed/mandacaru/800/600"],
    lastPatrol: "24/06/2026 10:20"
  },
  {
    name: "Fazenda Umbuzeiro",
    municipality: "Caicó",
    referencePoint: "RN-118 sentido Jucurutu, KM 18, entrada logo após a ponte",
    gpsCoordinates: "-6.4421, -37.1042",
    ownerName: "Manoel Medeiros de Araújo",
    cpf: "345.678.901-23",
    birthDate: "1955-09-10",
    contactPhone: "(84) 99123-4567",
    collaborativeOwner: true,
    wifiName: "Umbuzeiro_Wifi",
    wifiPass: "umbu1234",
    residents: ["Manoel Medeiros de Araújo", "Francisca Medeiros"],
    photos: ["https://picsum.photos/seed/umbuzeiro/800/600"],
    lastPatrol: "23/06/2026 15:40"
  },
  {
    name: "Chácara Seridó",
    municipality: "Acari",
    referencePoint: "Estrada Real da Povoação, KM 1.5, cerca viva de sansão-do-campo",
    gpsCoordinates: "-6.4258, -36.6421",
    ownerName: "Maria do Socorro Dantas",
    cpf: "456.789.012-34",
    birthDate: "1972-12-15",
    contactPhone: "(84) 98877-6655",
    collaborativeOwner: false,
    wifiName: "ChacaraSerido_Fibra",
    wifiPass: "acari8877",
    residents: ["Maria do Socorro Dantas"],
    photos: ["https://picsum.photos/seed/chacaraserido/800/600"],
    lastPatrol: "22/06/2026 11:15"
  },
  {
    name: "Sítio Catingueira",
    municipality: "Parelhas",
    referencePoint: "RN-086, KM 8, entrada oposta à olaria desativada",
    gpsCoordinates: "-6.6912, -36.6432",
    ownerName: "José Geraldo da Silva",
    cpf: "567.890.123-45",
    birthDate: "1980-07-04",
    contactPhone: "(84) 99444-3322",
    collaborativeOwner: true,
    wifiName: "Catingueira_VIP",
    wifiPass: "silva4433",
    residents: ["José Geraldo da Silva", "Clara Maria Silva", "Mateus Silva"],
    photos: ["https://picsum.photos/seed/catingueira/800/600"],
    lastPatrol: "25/06/2026 08:30"
  },
  {
    name: "Fazenda Caraúbas",
    municipality: "Jucurutu",
    referencePoint: "Margens do Rio Piranhas, acesso pela balsa, KM 2",
    gpsCoordinates: "-6.1685, -37.2612",
    ownerName: "Sebastião Alves de Souza",
    cpf: "678.901.234-56",
    birthDate: "1963-02-28",
    contactPhone: "(84) 99655-1122",
    collaborativeOwner: true,
    wifiName: "FazendaCaraubas",
    wifiPass: "caraubas96",
    residents: ["Sebastião Alves de Souza", "Tereza Souza"],
    photos: ["https://picsum.photos/seed/caraubas/800/600"],
    lastPatrol: "21/06/2026 16:10"
  },
  {
    name: "Sítio Sobrado",
    municipality: "Jardim do Seridó",
    referencePoint: "Acesso por paralelepípedo na saída para Parelhas, KM 4",
    gpsCoordinates: "-6.5912, -36.7915",
    ownerName: "Ana Beatriz de Melo",
    cpf: "789.012.345-67",
    birthDate: "1988-05-20",
    contactPhone: "(84) 98122-3344",
    collaborativeOwner: true,
    wifiName: "SobradoNet",
    wifiPass: "anabeatriz",
    residents: ["Ana Beatriz de Melo", "Felipe Melo"],
    photos: ["https://picsum.photos/seed/sobrado/800/600"],
    lastPatrol: "24/06/2026 09:45"
  },
  {
    name: "Fazenda Bom Jesus",
    municipality: "Caicó",
    referencePoint: "BR-427 sentido Jardim de Piranhas, KM 9, entroncamento do açude",
    gpsCoordinates: "-6.4711, -37.0812",
    ownerName: "Joaquim Fernandes Neto",
    cpf: "890.123.456-78",
    birthDate: "1967-10-30",
    contactPhone: "(84) 99233-4455",
    collaborativeOwner: true,
    wifiName: "BomJesusNet",
    wifiPass: "jesus4455",
    residents: ["Joaquim Fernandes Neto", "Gorete Fernandes", "Lucas Fernandes"],
    photos: ["https://picsum.photos/seed/bomjesus/800/600"],
    lastPatrol: "25/06/2026 10:15"
  },
  {
    name: "Sítio Juazeiro",
    municipality: "Cruzeta",
    referencePoint: "Acesso ao lado do Açude Público, KM 2.5, portão de madeira",
    gpsCoordinates: "-6.4012, -36.8015",
    ownerName: "Raimundo Nonato Costa",
    cpf: "901.234.567-89",
    birthDate: "1959-11-23",
    contactPhone: "(84) 98711-2233",
    collaborativeOwner: false,
    wifiName: "Juazeiro_Costa",
    wifiPass: "nonato1122",
    residents: ["Raimundo Nonato Costa", "Maria das Graças Costa"],
    photos: ["https://picsum.photos/seed/juazeiro/800/600"],
    lastPatrol: "19/06/2026 14:20"
  },
  {
    name: "Chácara Boa Vista",
    municipality: "Florânia",
    referencePoint: "Subida da Serra do Cajueiro, KM 1.2, mirante natural",
    gpsCoordinates: "-6.1311, -36.8212",
    ownerName: "Maria de Fátima Medeiros",
    cpf: "012.345.678-90",
    birthDate: "1978-01-18",
    contactPhone: "(84) 99988-7766",
    collaborativeOwner: true,
    wifiName: "BoaVista_Medeiros",
    wifiPass: "fatima7766",
    residents: ["Maria de Fátima Medeiros", "Letícia Medeiros"],
    photos: ["https://picsum.photos/seed/boavista/800/600"],
    lastPatrol: "23/06/2026 11:30"
  },
  {
    name: "Sítio Serra Verde",
    municipality: "Cerro Corá",
    referencePoint: "RN-041 sentido Lagoa Nova, KM 7, entrada na placa de reflorestamento",
    gpsCoordinates: "-5.9921, -36.3541",
    ownerName: "Pedro Álvares Cabral Neto",
    cpf: "123.012.345-01",
    birthDate: "1983-04-14",
    contactPhone: "(84) 99188-1122",
    collaborativeOwner: true,
    wifiName: "SerraVerde_Net",
    wifiPass: "pedro1122",
    residents: ["Pedro Álvares Cabral Neto", "Mônica Cabral"],
    photos: ["https://picsum.photos/seed/serraverde/800/600"],
    lastPatrol: "24/06/2026 15:50"
  },
  {
    name: "Fazenda Oiticica",
    municipality: "Ouro Branco",
    referencePoint: "RN-089 para o Ceará-Mirim, KM 4.5, casa amarela",
    gpsCoordinates: "-6.6915, -36.9531",
    ownerName: "Geraldo Luís dos Santos",
    cpf: "234.123.456-12",
    birthDate: "1965-06-02",
    contactPhone: "(84) 98833-2211",
    collaborativeOwner: true,
    wifiName: "Faz_Oiticica",
    wifiPass: "oiticica33",
    residents: ["Geraldo Luís dos Santos", "Sônia Santos", "Diego Santos"],
    photos: ["https://picsum.photos/seed/oiticica/800/600"],
    lastPatrol: "20/06/2026 16:10"
  },
  {
    name: "Sítio Riacho do Meio",
    municipality: "Santana do Seridó",
    referencePoint: "Estrada para São José do Sabugi, KM 3, porteira com sino de bronze",
    gpsCoordinates: "-6.7812, -36.7412",
    ownerName: "Rita de Cássia Oliveira",
    cpf: "345.234.567-23",
    birthDate: "1970-08-11",
    contactPhone: "(84) 99133-4455",
    collaborativeOwner: true,
    wifiName: "RiachoDoMeio_Wifi",
    wifiPass: "rita4455",
    residents: ["Rita de Cássia Oliveira", "Cláudio Oliveira"],
    photos: ["https://picsum.photos/seed/riachodomeio/800/600"],
    lastPatrol: "24/06/2026 13:40"
  },
  {
    name: "Chácara Monte Alegre",
    municipality: "Carnaúba dos Dantas",
    referencePoint: "Acesso próximo ao Monte do Galo, KM 1.8, muro de pedras rústicas",
    gpsCoordinates: "-6.5611, -36.6012",
    ownerName: "José Valdir Dantas",
    cpf: "456.345.678-34",
    birthDate: "1974-03-05",
    contactPhone: "(84) 98211-5544",
    collaborativeOwner: true,
    wifiName: "MonteAlegre_Dantas",
    wifiPass: "valdir5544",
    residents: ["José Valdir Dantas", "Sueli Dantas", "Bruno Dantas"],
    photos: ["https://picsum.photos/seed/montealegre/800/600"],
    lastPatrol: "22/06/2026 10:15"
  },
  {
    name: "Sítio Angicos",
    municipality: "São João do Sabugi",
    referencePoint: "RN-118 sentido Caicó, KM 15, entrada à esquerda no outdoor",
    gpsCoordinates: "-6.7212, -37.2112",
    ownerName: "Antônio Marcos de Brito",
    cpf: "567.456.789-45",
    birthDate: "1977-11-20",
    contactPhone: "(84) 99455-6677",
    collaborativeOwner: false,
    wifiName: "SitioAngicos_Wifi",
    wifiPass: "brito6677",
    residents: ["Antônio Marcos de Brito", "Marly Brito"],
    photos: ["https://picsum.photos/seed/angicos/800/600"],
    lastPatrol: "23/06/2026 15:30"
  },
  {
    name: "Fazenda Maniçoba",
    municipality: "Caicó",
    referencePoint: "Antiga Estrada da Serra, KM 6, porteira de madeira de lei",
    gpsCoordinates: "-6.4112, -37.1321",
    ownerName: "Elza Soares de Medeiros",
    cpf: "678.567.890-56",
    birthDate: "1951-01-12",
    contactPhone: "(84) 98765-1122",
    collaborativeOwner: true,
    wifiName: "Manicoba_Velox",
    wifiPass: "elza1122",
    residents: ["Elza Soares de Medeiros", "Juliana Medeiros"],
    photos: ["https://picsum.photos/seed/manicoba/800/600"],
    lastPatrol: "24/06/2026 17:15"
  },
  {
    name: "Sítio Malhada da Areia",
    municipality: "Currais Novos",
    referencePoint: "Acesso pela estrada da Cooperativa, KM 8, galpão de ordenha ao lado",
    gpsCoordinates: "-6.2731, -36.4982",
    ownerName: "Manoel Cipriano Filho",
    cpf: "789.678.901-67",
    birthDate: "1966-02-19",
    contactPhone: "(84) 98844-3322",
    collaborativeOwner: true,
    wifiName: "Malhada_Areia",
    wifiPass: "cipriano3322",
    residents: ["Manoel Cipriano Filho", "Zélia Cipriano"],
    photos: ["https://picsum.photos/seed/malhada/800/600"],
    lastPatrol: "25/06/2026 07:45"
  },
  {
    name: "Chácara Pôr do Sol",
    municipality: "Acari",
    referencePoint: "Estrada da represa de Gargalheiras, KM 4.2, casa de tijolos ecológicos",
    gpsCoordinates: "-6.4412, -36.6212",
    ownerName: "Tereza Cristina de Araújo",
    cpf: "890.789.012-78",
    birthDate: "1981-06-30",
    contactPhone: "(84) 99211-7788",
    collaborativeOwner: true,
    wifiName: "ChacaraPorDoSol",
    wifiPass: "sunset7788",
    residents: ["Tereza Cristina de Araújo", "Vinícius Araújo"],
    photos: ["https://picsum.photos/seed/pordosol/800/600"],
    lastPatrol: "25/06/2026 11:20"
  },
  {
    name: "Fazenda Tanques",
    municipality: "Parelhas",
    referencePoint: "Divisa estadual com PB, KM 14 da RN-086, ao lado do parque eólico",
    gpsCoordinates: "-6.6711, -36.6712",
    ownerName: "Luiz Gonzaga de Souza",
    cpf: "901.890.123-89",
    birthDate: "1949-09-22",
    contactPhone: "(84) 99466-2233",
    collaborativeOwner: true,
    wifiName: "FazendaTanques_Net",
    wifiPass: "luizgonzaga",
    residents: ["Luiz Gonzaga de Souza", "Helena Souza", "Daniel Souza"],
    photos: ["https://picsum.photos/seed/tanques/800/600"],
    lastPatrol: "24/06/2026 16:30"
  },
  {
    name: "Sítio Pedra Lavrada",
    municipality: "Jardim do Seridó",
    referencePoint: "Serra do Carcará, KM 6.5, porteira de madeira com pintura branca",
    gpsCoordinates: "-6.5712, -36.7712",
    ownerName: "Francisca das Chagas Melo",
    cpf: "012.901.234-90",
    birthDate: "1973-10-14",
    contactPhone: "(84) 98155-6677",
    collaborativeOwner: true,
    wifiName: "PedraLavrada_Fibra",
    wifiPass: "chagas6677",
    residents: ["Francisca das Chagas Melo", "Mariana Melo", "Ruan Melo"],
    photos: ["https://picsum.photos/seed/pedralavrada/800/600"],
    lastPatrol: "21/06/2026 09:10"
  },
  {
    name: "Fazenda Bela Vista",
    municipality: "Jucurutu",
    referencePoint: "Serra do João do Vale, KM 11.2, porteira dupla próximo à capela",
    gpsCoordinates: "-6.1912, -37.2312",
    ownerName: "Paulo Roberto da Costa",
    cpf: "123.012.345-99",
    birthDate: "1969-05-18",
    contactPhone: "(84) 99611-2233",
    collaborativeOwner: true,
    wifiName: "Faz_BelaVista",
    wifiPass: "paulo2233",
    residents: ["Paulo Roberto da Costa", "Aline da Costa"],
    photos: ["https://picsum.photos/seed/belavista/800/600"],
    lastPatrol: "24/06/2026 14:15"
  }
];
*/

export function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === "undefined") {
      reject(new Error("IndexedDB is only available in the browser"));
      return;
    }

    const request = window.indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => {
      reject(request.error);
    };

    request.onsuccess = () => {
      const db = request.result;
      resolve(db);
    };

    request.onupgradeneeded = (event) => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, {
          keyPath: "id",
          autoIncrement: true,
        });

        // Indexes for quick searching
        store.createIndex("name", "name", { unique: false });
        store.createIndex("ownerName", "ownerName", { unique: false });
        store.createIndex("cpf", "cpf", { unique: false });

        // Seed initial data
        SEED_PROPERTIES.forEach((prop) => {
          store.add(prop);
        });
      }
    };
  });
}

/**
 * Salva um novo imóvel ou atualiza um imóvel existente no IndexedDB.
 */
export async function saveProperty(property: Omit<Property, "id"> & { id?: number }): Promise<number> {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], "readwrite");
    const store = transaction.objectStore(STORE_NAME);

    // If ID exists, we are updating. Otherwise, let IndexedDB auto-assign it.
    const request = property.id !== undefined ? store.put(property) : store.add(property);

    request.onsuccess = () => {
      resolve(request.result as number);
    };

    request.onerror = () => {
      reject(request.error);
    };
  });
}

/**
 * Busca imóveis de forma rápida pelo nome da propriedade ou do proprietário.
 */
export async function searchProperties(query: string): Promise<Property[]> {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], "readonly");
    const store = transaction.objectStore(STORE_NAME);
    const request = store.getAll();

    request.onsuccess = () => {
      const allProperties = request.result as Property[];
      if (!query.trim()) {
        resolve(allProperties);
        return;
      }

      const normalizedQuery = query.toLowerCase().trim();
      const filtered = allProperties.filter((prop) => {
        const nameMatch = prop.name.toLowerCase().includes(normalizedQuery);
        const ownerMatch = prop.ownerName.toLowerCase().includes(normalizedQuery);
        
        // Ensure CPF search matches only if digits are typed
        const queryDigits = normalizedQuery.replace(/\D/g, "");
        const cpfMatch = queryDigits.length > 0 && prop.cpf.replace(/\D/g, "").includes(queryDigits);
        const phoneMatch = queryDigits.length > 0 && prop.contactPhone.replace(/\D/g, "").includes(queryDigits);
        
        const municipalityMatch = prop.municipality.toLowerCase().includes(normalizedQuery);
        const referenceMatch = prop.referencePoint ? prop.referencePoint.toLowerCase().includes(normalizedQuery) : false;
        
        // Check if any resident matches the query
        const residentMatch = prop.residents && prop.residents.some((res) => 
          res.toLowerCase().includes(normalizedQuery)
        );

        // Check if wifi name matches
        const wifiMatch = prop.wifiName ? prop.wifiName.toLowerCase().includes(normalizedQuery) : false;

        return nameMatch || ownerMatch || cpfMatch || phoneMatch || municipalityMatch || referenceMatch || residentMatch || wifiMatch;
      });

      resolve(filtered);
    };

    request.onerror = () => {
      reject(request.error);
    };
  });
}

/**
 * Retorna uma propriedade específica pelo ID.
 */
export async function getPropertyById(id: number): Promise<Property | undefined> {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], "readonly");
    const store = transaction.objectStore(STORE_NAME);
    const request = store.get(id);

    request.onsuccess = () => {
      resolve(request.result);
    };

    request.onerror = () => {
      reject(request.error);
    };
  });
}

/**
 * Retorna todas as propriedades salvas.
 */
export async function getAllProperties(): Promise<Property[]> {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], "readonly");
    const store = transaction.objectStore(STORE_NAME);
    const request = store.getAll();

    request.onsuccess = () => {
      resolve(request.result);
    };

    request.onerror = () => {
      reject(request.error);
    };
  });
}

/**
 * Exclui uma propriedade pelo ID.
 */
export async function deleteProperty(id: number): Promise<void> {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], "readwrite");
    const store = transaction.objectStore(STORE_NAME);
    const request = store.delete(id);

    request.onsuccess = () => {
      resolve();
    };

    request.onerror = () => {
      reject(request.error);
    };
  });
}

/**
 * Exclui todas as propriedades do IndexedDB local.
 */
export async function clearAllProperties(): Promise<void> {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], "readwrite");
    const store = transaction.objectStore(STORE_NAME);
    const request = store.clear();

    request.onsuccess = () => {
      resolve();
    };

    request.onerror = () => {
      reject(request.error);
    };
  });
}
