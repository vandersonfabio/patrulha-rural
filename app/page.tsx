"use client";

import React, { useState, useEffect } from "react";
import { 
  Shield, 
  Search, 
  User, 
  Plus, 
  Trash2, 
  MapPin, 
  Wifi, 
  Users, 
  QrCode, 
  Map, 
  ArrowLeft, 
  LogOut, 
  Calendar, 
  Phone, 
  FileText, 
  Lock, 
  Eye, 
  EyeOff,
  CheckCircle,
  AlertTriangle,
  MapPinned,
  Check,
  Camera,
  Upload,
  Pencil,
  Cloud,
  Database,
  RefreshCw,
  CloudUpload,
  CloudDownload,
  Copy
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { QRCodeSVG } from "qrcode.react";
import { 
  Property, 
  saveProperty, 
  searchProperties, 
  getAllProperties, 
  getPropertyById, 
  deleteProperty,
  clearAllProperties
} from "@/lib/db";
import { supabase } from "@/lib/supabase";
import SeridoMap from "@/components/SeridoMap";

// Helper functions defined outside the component to preserve React component purity
function generateDefaultPhoto(): string {
  const randomPicId = Math.floor(Math.random() * 1000);
  return `https://picsum.photos/seed/${randomPicId}/800/600`;
}

function getCurrentDateString(): string {
  return new Date().toISOString().split("T")[0];
}

function getFormattedPatrolDate(): string {
  const d = new Date();
  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const year = d.getFullYear();
  const hours = String(d.getHours()).padStart(2, "0");
  const minutes = String(d.getMinutes()).padStart(2, "0");
  return `${day}/${month}/${year} ${hours}:${minutes}`;
}

// Simulated default credentials for simple demonstration
const DEFAULT_BADGE = "agente@patrulha.gov";
const DEFAULT_PASSWORD = "senha_patrulha";

export default function PatrulhaRuralApp() {
  const [isMounted, setIsMounted] = useState(false);

  // Navigation State
  const [currentView, setCurrentView] = useState<"login" | "search" | "details" | "create" | "supabase">("login");
  const [selectedPropertyId, setSelectedPropertyId] = useState<number | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentUser, setCurrentUser] = useState<string>("");

  // Supabase Integration State
  const [dbSource, setDbSource] = useState<"local" | "supabase">("local");
  const [supabaseStatus, setSupabaseStatus] = useState<{
    connected: boolean;
    tableExists: boolean;
    supabaseUrl: string;
    usingFallback: boolean;
    sqlSchema?: string;
    message?: string;
  } | null>(null);
  const [isCheckingSupabase, setIsCheckingSupabase] = useState(false);
  const [syncProgress, setSyncProgress] = useState<{ current: number; total: number; type: "push" | "pull" | null }>({ current: 0, total: 0, type: null });
  const [isSyncing, setIsSyncing] = useState(false);

  // Login Form States
  const [loginBadge, setLoginBadge] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState("");
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // Search States
  const [searchQuery, setSearchQuery] = useState("");
  const [propertiesList, setPropertiesList] = useState<Property[]>([]);
  const [allProperties, setAllProperties] = useState<Property[]>([]);
  const [activeFilter, setActiveFilter] = useState<"todos" | "proprietarios" | "propriedades" | "colaborativos">("todos");
  
  const [recentSearches, setRecentSearches] = useState<{ id: number; name: string; subtitle: string; type: "property" | "owner" }[]>([]);

  const checkSupabaseConnection = React.useCallback(async () => {
    setIsCheckingSupabase(true);
    try {
      const res = await fetch("/api/supabase/status");
      const data = await res.json();
      setSupabaseStatus(data);
    } catch (err) {
      console.error(err);
      setSupabaseStatus({
        connected: false,
        tableExists: false,
        supabaseUrl: "https://frswlyctlykrnaorfoql.supabase.co",
        usingFallback: true,
        message: "Erro ao conectar-se à API local do servidor."
      });
    } finally {
      setIsCheckingSupabase(false);
    }
  }, []);

  useEffect(() => {
    Promise.resolve().then(async () => {
      setIsMounted(true);
      
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (session?.user) {
          const email = session.user.email || "";
          const badgeName = email.split("@")[0] || "Agente";
          const formattedUser = `Agente ${badgeName}`;
          setIsLoggedIn(true);
          setCurrentUser(formattedUser);
          localStorage.setItem("patrulha_user", formattedUser);
          setCurrentView("search");
        } else {
          // Fallback to local storage if no active Supabase session
          const user = localStorage.getItem("patrulha_user");
          if (user) {
            setIsLoggedIn(true);
            setCurrentUser(user);
            setCurrentView("search");
          }
        }
      } catch (err) {
        console.error("Erro ao verificar sessão do Supabase no login:", err);
        const user = localStorage.getItem("patrulha_user");
        if (user) {
          setIsLoggedIn(true);
          setCurrentUser(user);
          setCurrentView("search");
        }
      }

      const saved = localStorage.getItem("patrulha_recent_searches");
      if (saved) {
        try {
          setRecentSearches(JSON.parse(saved));
        } catch (e) {
          console.error(e);
        }
      }
      const source = localStorage.getItem("patrulha_db_source") as "local" | "supabase";
      if (source) {
        setDbSource(source);
      }
    });
  }, []);

  // Verify connection status on login
  useEffect(() => {
    if (isLoggedIn) {
      Promise.resolve().then(() => {
        checkSupabaseConnection();
      });
    }
  }, [isLoggedIn, checkSupabaseConnection]);


  const addToRecentSearches = React.useCallback((property: Property) => {
    if (property.id === undefined) return;
    setRecentSearches(prev => {
      const filtered = prev.filter(item => !(item.id === property.id));
      const newItem = {
        id: property.id!,
        name: property.name,
        subtitle: property.referencePoint || property.municipality || "Sem referência",
        type: "property" as const
      };
      const updated = [newItem, ...filtered].slice(0, 5);
      if (typeof window !== "undefined") {
        localStorage.setItem("patrulha_recent_searches", JSON.stringify(updated));
      }
      return updated;
    });
  }, []);

  const syncLocalToSupabase = async () => {
    setIsSyncing(true);
    try {
      const localProps = await getAllProperties();
      if (localProps.length === 0) {
        showErrorFeedback("Não há dados locais para sincronizar.");
        return;
      }

      setSyncProgress({ current: 0, total: localProps.length, type: "push" });

      for (let i = 0; i < localProps.length; i++) {
        const prop = localProps[i];
        const res = await fetch("/api/properties", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ property: prop }),
        });
        if (!res.ok) {
          const errData = await res.json();
          throw new Error(errData.error || "Erro ao sincronizar item");
        }
        setSyncProgress(prev => ({ ...prev, current: i + 1 }));
      }

      showSuccessFeedback("Todos os registros locais foram enviados para o Supabase!");
      await checkSupabaseConnection();
      await refreshPropertiesList("", "supabase");
    } catch (err: any) {
      console.error(err);
      showErrorFeedback("Erro na sincronização: " + err.message);
    } finally {
      setIsSyncing(false);
      setSyncProgress({ current: 0, total: 0, type: null });
    }
  };

  const syncSupabaseToLocal = async () => {
    setIsSyncing(true);
    try {
      const res = await fetch("/api/properties");
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Erro ao buscar dados do Supabase");
      }
      const data = await res.json();
      const cloudProps = data.properties || [];
      if (cloudProps.length === 0) {
        showErrorFeedback("Não há dados na nuvem para baixar.");
        return;
      }

      setSyncProgress({ current: 0, total: cloudProps.length, type: "pull" });

      for (let i = 0; i < cloudProps.length; i++) {
        const prop = cloudProps[i];
        await saveProperty(prop);
        setSyncProgress(prev => ({ ...prev, current: i + 1 }));
      }

      showSuccessFeedback("Dados importados da Nuvem para o dispositivo local!");
      await refreshPropertiesList("", "local");
    } catch (err: any) {
      console.error(err);
      showErrorFeedback("Erro ao baixar dados: " + err.message);
    } finally {
      setIsSyncing(false);
      setSyncProgress({ current: 0, total: 0, type: null });
    }
  };

  const [isClearing, setIsClearing] = useState(false);

  const clearAllData = async () => {
    if (!window.confirm("ATENÇÃO: Isso excluirá permanentemente TODOS os cadastros locais (IndexedDB) e da Nuvem (Supabase). Deseja continuar?")) {
      return;
    }
    
    setIsClearing(true);
    try {
      // 1. Clear Local IndexedDB
      await clearAllProperties();
      
      // 2. Clear Supabase if connected and table exists
      if (supabaseStatus?.connected && supabaseStatus?.tableExists) {
        const res = await fetch("/api/properties?clearAll=true", {
          method: "DELETE"
        });
        if (!res.ok) {
          const errData = await res.json();
          throw new Error(errData.error || "Erro ao limpar dados no Supabase");
        }
      }
      
      // 3. Clear memory state
      setPropertiesList([]);
      setAllProperties([]);
      setRecentSearches([]);
      setSelectedPropertyId(null);
      setSelectedProperty(null);
      
      showSuccessFeedback("Todos os dados locais e de nuvem foram apagados!");
      await refreshPropertiesList();
    } catch (err: any) {
      console.error(err);
      showErrorFeedback("Erro ao apagar dados: " + err.message);
    } finally {
      setIsClearing(false);
    }
  };

  // Detailed Property State
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
  const [propertyToDelete, setPropertyToDelete] = useState<Property | null>(null);

  // New Property Form States
  const [formData, setFormData] = useState({
    name: "",
    municipality: "Município X",
    referencePoint: "",
    gpsCoordinates: "",
    ownerName: "",
    cpf: "",
    birthDate: "",
    contactPhone: "",
    collaborativeOwner: true,
    wifiName: "",
    wifiPass: "",
    photo: "", // Base64 or URL for the property photo
  });
  const [isEditing, setIsEditing] = useState(false);
  const [residents, setResidents] = useState<{ name: string; relation: string }[]>([]);
  const [newResidentName, setNewResidentName] = useState("");
  const [newResidentRelation, setNewResidentRelation] = useState("");
  
  // Dynamic UI feedback states
  const [successToast, setSuccessToast] = useState("");
  const [errorToast, setErrorToast] = useState("");
  const [isLocating, setIsLocating] = useState(false);
  const [showAllProperties, setShowAllProperties] = useState(false);

  // Load/Refresh the property catalog from IndexedDB or Supabase
  const refreshPropertiesList = React.useCallback(async (query = "", forceSource?: "local" | "supabase") => {
    const activeSource = forceSource || dbSource;
    try {
      if (activeSource === "supabase") {
        const res = await fetch("/api/properties");
        if (!res.ok) {
          const errData = await res.json();
          if (errData.error === "table_missing") {
            throw new Error("A tabela 'properties' está pendente de criação no Supabase.");
          }
          throw new Error(errData.error || "Erro de conexão com o Supabase");
        }
        const data = await res.json();
        const all = data.properties || [];
        
        let results = all;
        if (query.trim()) {
          const normalizedQuery = query.toLowerCase().trim();
          results = all.filter((prop: Property) => {
            const nameMatch = prop.name.toLowerCase().includes(normalizedQuery);
            const ownerMatch = prop.ownerName.toLowerCase().includes(normalizedQuery);
            
            const queryDigits = normalizedQuery.replace(/\D/g, "");
            const cpfMatch = queryDigits.length > 0 && prop.cpf.replace(/\D/g, "").includes(queryDigits);
            const phoneMatch = queryDigits.length > 0 && prop.contactPhone.replace(/\D/g, "").includes(queryDigits);
            
            const municipalityMatch = prop.municipality.toLowerCase().includes(normalizedQuery);
            const referenceMatch = prop.referencePoint ? prop.referencePoint.toLowerCase().includes(normalizedQuery) : false;
            
            const residentMatch = prop.residents && prop.residents.some((res) => 
              res.toLowerCase().includes(normalizedQuery)
            );
            const wifiMatch = prop.wifiName ? prop.wifiName.toLowerCase().includes(normalizedQuery) : false;
            
            return nameMatch || ownerMatch || cpfMatch || phoneMatch || municipalityMatch || referenceMatch || residentMatch || wifiMatch;
          });
        }
        
        setPropertiesList(results);
        setAllProperties(all);
      } else {
        const results = await searchProperties(query);
        const all = await getAllProperties();
        setPropertiesList(results);
        setAllProperties(all);
      }
    } catch (err: any) {
      console.error("Erro ao carregar dados:", err);
      setErrorToast(err.message || "Erro ao carregar dados.");
      
      // Safe fallback: switch back to local if cloud fails
      if (activeSource === "supabase") {
        setDbSource("local");
        localStorage.setItem("patrulha_db_source", "local");
        const results = await searchProperties(query);
        const all = await getAllProperties();
        setPropertiesList(results);
        setAllProperties(all);
      }
    }
  }, [dbSource]);

  // Load properties on mount
  useEffect(() => {
    let active = true;
    Promise.resolve().then(() => {
      if (active) {
        refreshPropertiesList();
      }
    });
    return () => {
      active = false;
    };
  }, [refreshPropertiesList]);

  // Sync details when selected ID changes
  useEffect(() => {
    let active = true;
    if (selectedPropertyId !== null) {
      if (dbSource === "supabase") {
        const prop = allProperties.find(p => p.id === selectedPropertyId);
        if (active && prop) {
          Promise.resolve().then(() => {
            if (active) {
              setSelectedProperty(prop);
            }
          });
        } else {
          // Fallback fetch
          fetch("/api/properties")
            .then(res => res.json())
            .then(data => {
              const found = (data.properties || []).find((p: Property) => p.id === selectedPropertyId);
              if (active && found) {
                setSelectedProperty(found);
              }
            })
            .catch(err => console.error("Error fetching single property", err));
        }
      } else {
        getPropertyById(selectedPropertyId).then((prop) => {
          if (active && prop) {
            setSelectedProperty(prop);
          }
        });
      }
    } else {
      // Avoid synchronous state setting on mount/effect to prevent cascading render warnings
      Promise.resolve().then(() => {
        if (active) {
          setSelectedProperty(null);
        }
      });
    }
    return () => {
      active = false;
    };
  }, [selectedPropertyId, dbSource, allProperties]);

  // Handle Search Input Change
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setSearchQuery(val);
    refreshPropertiesList(val);
  };

  // Handle Login submission
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginBadge.trim() || !loginPassword.trim()) {
      setLoginError("Por favor, preencha todos os campos.");
      return;
    }

    setIsLoggingIn(true);
    setLoginError("");

    try {
      // Normaliza o campo para o formato de email para o Supabase Auth.
      // Se não for email válido, assume formato badge e acrescenta @patrulha.gov
      const email = loginBadge.includes("@") ? loginBadge.trim() : `${loginBadge.trim()}@patrulha.gov`;

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password: loginPassword,
      });

      if (error) {
        setLoginError(error.message || "Erro na autenticação. Verifique os dados.");
        showErrorFeedback("Erro no Login: " + error.message);
        return;
      }

      if (data?.user) {
        const userEmail = data.user.email || "";
        const badgeName = userEmail.split("@")[0] || loginBadge;
        const formattedUser = `Agente ${badgeName}`;
        
        setIsLoggedIn(true);
        setCurrentUser(formattedUser);
        localStorage.setItem("patrulha_user", formattedUser);
        setCurrentView("search");
        showSuccessFeedback("Acesso autorizado. Patrulha iniciada!");
      }
    } catch (err: any) {
      console.error(err);
      setLoginError(err.message || "Erro inesperado ao realizar login.");
    } finally {
      setIsLoggingIn(false);
    }
  };

  // Auto-fill credential for reviewer convenience
  const handleAutoFillLogin = () => {
    setLoginBadge(DEFAULT_BADGE);
    setLoginPassword(DEFAULT_PASSWORD);
    setLoginError("");
  };

  // Logout
  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
    } catch (err) {
      console.error("Erro ao realizar logout do Supabase:", err);
    }
    setIsLoggedIn(false);
    setCurrentUser("");
    localStorage.removeItem("patrulha_user");
    setCurrentView("login");
    showSuccessFeedback("Sessão encerrada!");
  };

  // Mask inputs
  const formatCPF = (value: string) => {
    const numbers = value.replace(/\D/g, "").slice(0, 11);
    if (numbers.length <= 3) return numbers;
    if (numbers.length <= 6) return `${numbers.slice(0, 3)}.${numbers.slice(3)}`;
    if (numbers.length <= 9) return `${numbers.slice(0, 3)}.${numbers.slice(3, 6)}.${numbers.slice(6)}`;
    return `${numbers.slice(0, 3)}.${numbers.slice(3, 6)}.${numbers.slice(6, 9)}-${numbers.slice(9, 11)}`;
  };

  const formatPhone = (value: string) => {
    const numbers = value.replace(/\D/g, "").slice(0, 11);
    if (numbers.length <= 2) return numbers;
    if (numbers.length <= 6) return `(${numbers.slice(0, 2)}) ${numbers.slice(2)}`;
    if (numbers.length <= 10) return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 6)}-${numbers.slice(6)}`;
    return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 7)}-${numbers.slice(7, 11)}`;
  };

  const handleFormFieldChange = (field: string, value: any) => {
    let finalValue = value;
    if (field === "cpf") finalValue = formatCPF(value);
    if (field === "contactPhone") finalValue = formatPhone(value);

    setFormData(prev => ({
      ...prev,
      [field]: finalValue
    }));
  };

  // Add resident to list
  const handleAddResident = () => {
    if (!newResidentName.trim()) return;
    const relation = newResidentRelation.trim() || "Residente";
    setResidents(prev => [...prev, { name: newResidentName.trim(), relation }]);
    setNewResidentName("");
    setNewResidentRelation("");
  };

  // Remove resident from list
  const handleRemoveResident = (index: number) => {
    setResidents(prev => prev.filter((_, i) => i !== index));
  };

  // Grab Current GPS coordinates
  const handleGetLocation = () => {
    if (typeof window === "undefined" || !navigator.geolocation) {
      showErrorFeedback("Geolocalização não é suportada neste navegador.");
      return;
    }

    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        const coordsStr = `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;
        handleFormFieldChange("gpsCoordinates", coordsStr);
        setIsLocating(false);
        showSuccessFeedback("Coordenadas obtidas com sucesso!");
      },
      (error) => {
        console.error("Erro ao obter geolocalização", error);
        // Fallback to random realistic local rural coordinates if permission is blocked in simulation
        const demoLat = (-25.1234 + (Math.random() - 0.5) * 0.05).toFixed(6);
        const demoLng = (-50.1234 + (Math.random() - 0.5) * 0.05).toFixed(6);
        handleFormFieldChange("gpsCoordinates", `${demoLat}, ${demoLng}`);
        setIsLocating(false);
        showSuccessFeedback("Simulado: Coordenadas locais obtidas (GPS bloqueado/timeout).");
      },
      { enableHighAccuracy: true, timeout: 5000 }
    );
  };

  // Form Submission
  const handleSavePropertyForm = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validations
    if (!formData.name.trim()) {
      showErrorFeedback("O nome da propriedade é obrigatório.");
      return;
    }
    if (!formData.ownerName.trim()) {
      showErrorFeedback("O nome do proprietário é obrigatório.");
      return;
    }

    const residentsArray = residents.map(r => `${r.name} (${r.relation})`);
    
    // Determine the photo to save
    let finalPhoto = formData.photo.trim();
    if (!finalPhoto) {
      if (isEditing && selectedProperty && selectedProperty.photos && selectedProperty.photos.length > 0) {
        finalPhoto = selectedProperty.photos[0];
      } else {
        finalPhoto = generateDefaultPhoto();
      }
    }

    const propertyToSave: Property = {
      name: formData.name.trim(),
      municipality: formData.municipality.trim() || "Município X",
      referencePoint: formData.referencePoint.trim(),
      gpsCoordinates: formData.gpsCoordinates.trim() || "-25.1234, -50.1234",
      ownerName: formData.ownerName.trim(),
      cpf: formData.cpf.trim() || "000.000.000-00",
      birthDate: formData.birthDate || getCurrentDateString(),
      contactPhone: formData.contactPhone.trim() || "(00) 00000-0000",
      collaborativeOwner: formData.collaborativeOwner,
      wifiName: formData.wifiName.trim(),
      wifiPass: formData.wifiPass.trim(),
      residents: residentsArray.length > 0 ? residentsArray : [formData.ownerName.trim()],
      photos: [finalPhoto],
      lastPatrol: getFormattedPatrolDate() // Always update the last patrol timestamp on edit/create
    };

    if (isEditing && selectedPropertyId !== null) {
      propertyToSave.id = selectedPropertyId;
    }

    try {
      let savedId: number;
      let updatedProp: Property | undefined;

      if (dbSource === "supabase") {
        const res = await fetch("/api/properties", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ property: propertyToSave }),
        });
        if (!res.ok) {
          const errData = await res.json();
          throw new Error(errData.error || "Erro ao salvar na Nuvem (Supabase)");
        }
        const resData = await res.json();
        if (!resData.property) {
          throw new Error("Erro de resposta do Supabase: propriedade não retornada.");
        }
        updatedProp = resData.property;
        savedId = resData.property.id;
      } else {
        savedId = await saveProperty(propertyToSave);
        updatedProp = await getPropertyById(savedId);
      }
      
      showSuccessFeedback(
        isEditing 
          ? `Propriedade "${propertyToSave.name}" atualizada com sucesso!`
          : `Propriedade "${propertyToSave.name}" cadastrada com sucesso!`
      );
      
      // Clear form
      setFormData({
        name: "",
        municipality: "Município X",
        referencePoint: "",
        gpsCoordinates: "",
        ownerName: "",
        cpf: "",
        birthDate: "",
        contactPhone: "",
        collaborativeOwner: true,
        wifiName: "",
        wifiPass: "",
        photo: "",
      });
      setResidents([]);

      // Refresh listings
      await refreshPropertiesList();
      
      if (isEditing) {
        setIsEditing(false);
      }

      // Refresh the selected property details immediately
      if (updatedProp) {
        setSelectedProperty(updatedProp);
        addToRecentSearches(updatedProp);
      }

      setSelectedPropertyId(savedId);
      setCurrentView("details");
    } catch (err: any) {
      console.error(err);
      showErrorFeedback(err.message || "Erro ao gravar os dados.");
    }
  };

  // Utility feedback banners
  const showSuccessFeedback = (msg: string) => {
    setSuccessToast(msg);
    setTimeout(() => setSuccessToast(""), 4000);
  };

  const showErrorFeedback = (msg: string) => {
    setErrorToast(msg);
    setTimeout(() => setErrorToast(""), 4000);
  };

  // Quick Action Search filters
  const filteredProperties = propertiesList.filter((prop) => {
    if (activeFilter === "todos") return true;
    if (activeFilter === "colaborativos") return prop.collaborativeOwner;
    if (activeFilter === "propriedades") return true; // already search fits
    if (activeFilter === "proprietarios") return true; // already search fits
    return true;
  });

  // Handler to quickly trigger recent searches
  const handleRecentSearchTap = (query: string, item?: { id: number; type: "property" | "owner" }) => {
    if (item && item.id) {
      setSelectedPropertyId(item.id);
      setCurrentView("details");
    } else {
      setSearchQuery(query);
      refreshPropertiesList(query);
    }
  };

  if (!isMounted) {
    return (
      <div className="min-h-screen bg-[#121410] flex items-center justify-center" id="loading-screen">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-4 border-[#bfcca1] border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-xs font-mono text-[#76786d] uppercase tracking-widest">Iniciando Sistema...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#121410] text-[#e3e3dc] font-sans antialiased flex flex-col items-center justify-start overflow-x-hidden">
      
      {/* Toast Feedbacks */}
      <AnimatePresence>
        {successToast && (
          <motion.div 
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 16 }}
            exit={{ opacity: 0, y: -50 }}
            className="fixed top-4 z-[999] bg-[#3b4626] border border-[#bfcca1] text-[#e3e3dc] px-4 py-3 rounded-lg shadow-xl flex items-center gap-2 max-w-sm"
          >
            <CheckCircle className="w-5 h-5 text-[#bfcca1] shrink-0" />
            <span className="text-sm font-semibold">{successToast}</span>
          </motion.div>
        )}

        {errorToast && (
          <motion.div 
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 16 }}
            exit={{ opacity: 0, y: -50 }}
            className="fixed top-4 z-[999] bg-[#690007] border border-[#ff8f85] text-[#ffdad6] px-4 py-3 rounded-lg shadow-xl flex items-center gap-2 max-w-sm"
          >
            <AlertTriangle className="w-5 h-5 text-[#ffb4ac] shrink-0" />
            <span className="text-sm font-semibold">{errorToast}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Primary Container (Responsive viewport simulating real mobile device context) */}
      <div className="w-full max-w-md min-h-screen bg-[#121410] flex flex-col relative pb-24 shadow-2xl">
        
        {/* App Header (Only visible if logged in) */}
        {isLoggedIn && currentView !== "login" && (
          <header className="sticky top-0 z-50 bg-[#1a1c18] border-b border-[#45483e] h-16 px-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <img 
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuAJoBcCcH86196pEyAAMaEbi2k_nkLb-W9-HL2kXcKw2aHtG47qpHVGgmMxaKmUOpcdiQsLiKACXbpsLh7UZHqy6asCEsJ15oyGQE4TlAt8t-gnsJ02A1sGjh5a-V53L3qBHbfXtauxP1f_jcswvi_H7zE0cY374Ur7i_9m6UJeYnQvs_uD1PKXI_b4hcMYomdqjGJ5_P5zCbkiMWIKmwObTWZ4DeSeEeLkYc5uUNCXKFJ8CzKpDB86vO6QMbsU42EF5SWok2bbPg" 
                alt="Logo 6º BPM" 
                className="h-9 w-9 object-contain bg-white rounded-full p-0.5"
              />
              <div>
                <h1 className="text-sm font-bold text-[#bfcca1] leading-tight">Patrulha Rural</h1>
                <p className="text-[10px] text-[#c6c7bb] font-mono leading-none">{currentUser}</p>
              </div>
            </div>
            
            <button 
              onClick={handleLogout} 
              className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-[#2a2d28] text-[#c6c7bb] hover:text-[#ffb4ac] transition-colors"
              title="Sair"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </header>
        )}

        {/* Content Screens with slide animations */}
        <main className="flex-1 p-4 flex flex-col justify-start">
          <AnimatePresence mode="wait">
            
            {/* ----------------- LOGIN VIEW ----------------- */}
            {currentView === "login" && !isLoggedIn && (
              <motion.div
                key="login"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                className="flex-1 flex flex-col justify-center py-6"
              >
                {/* Crest and Title */}
                <div className="flex flex-col items-center text-center mb-8">
                  <div className="w-24 h-24 rounded-full bg-white border-2 border-[#bfcca1] flex items-center justify-center mb-4 shadow-md overflow-hidden p-2">
                    <img 
                      src="https://lh3.googleusercontent.com/aida-public/AB6AXuAJoBcCcH86196pEyAAMaEbi2k_nkLb-W9-HL2kXcKw2aHtG47qpHVGgmMxaKmUOpcdiQsLiKACXbpsLh7UZHqy6asCEsJ15oyGQE4TlAt8t-gnsJ02A1sGjh5a-V53L3qBHbfXtauxP1f_jcswvi_H7zE0cY374Ur7i_9m6UJeYnQvs_uD1PKXI_b4hcMYomdqjGJ5_P5zCbkiMWIKmwObTWZ4DeSeEeLkYc5uUNCXKFJ8CzKpDB86vO6QMbsU42EF5SWok2bbPg" 
                      alt="Crest 6º BPM" 
                      className="w-full h-full object-contain"
                    />
                  </div>
                  <h1 className="text-2xl font-bold text-[#bfcca1] tracking-tight">Patrulha Rural</h1>
                  <h2 className="text-lg text-[#fff9ef] font-semibold tracking-wide">6º BPM</h2>
                  <p className="text-xs text-[#c6c7bb] max-w-xs mt-2 font-medium">
                    Acesso restrito a agentes credenciados e patrulhas autorizadas.
                  </p>
                </div>

                {/* Form Card */}
                <div className="bg-[#1a1c18] border border-[#45483e] rounded-xl p-6 shadow-xl">
                  <form onSubmit={handleLoginSubmit} className="space-y-4">
                    {loginError && (
                      <div className="bg-[#69000c] text-[#ffdad6] text-xs p-3 rounded-lg flex items-center gap-2 border border-[#92030f]">
                        <AlertTriangle className="w-4 h-4 shrink-0" />
                        <span>{loginError}</span>
                      </div>
                    )}

                    <div className="space-y-1">
                      <label htmlFor="badge" className="text-xs font-semibold text-[#e3e3dc] uppercase tracking-wider block">
                        Matrícula ou Usuário
                      </label>
                      <input 
                        type="text" 
                        id="badge"
                        placeholder="Ex: 123456-7"
                        value={loginBadge}
                        onChange={(e) => setLoginBadge(e.target.value)}
                        className="w-full bg-[#121410] border-2 border-[#45483e] focus:border-[#bfcca1] rounded-lg px-4 py-3 text-sm text-[#e3e3dc] outline-none transition-all placeholder-[#76786d]"
                        required
                      />
                    </div>

                    <div className="space-y-1">
                      <label htmlFor="pass" className="text-xs font-semibold text-[#e3e3dc] uppercase tracking-wider block">
                        Senha
                      </label>
                      <div className="relative">
                        <input 
                          type={showPassword ? "text" : "password"} 
                          id="pass"
                          placeholder="••••••••"
                          value={loginPassword}
                          onChange={(e) => setLoginPassword(e.target.value)}
                          className="w-full bg-[#121410] border-2 border-[#45483e] focus:border-[#bfcca1] rounded-lg pl-4 pr-11 py-3 text-sm text-[#e3e3dc] outline-none transition-all placeholder-[#76786d]"
                          required
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-[#c6c7bb] hover:text-[#e3e3dc]"
                        >
                          {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-1">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input type="checkbox" className="rounded bg-[#121410] border-[#45483e] text-[#bfcca1] focus:ring-[#bfcca1]" />
                        <span className="text-xs text-[#c6c7bb]">Lembrar-me</span>
                      </label>
                      <span className="text-xs text-[#bfcca1] hover:underline cursor-pointer">Recuperar Senha</span>
                    </div>

                    <button
                      type="submit"
                      disabled={isLoggingIn}
                      className="w-full bg-[#bfcca1] hover:bg-[#dbe8bc] disabled:bg-[#45483e] disabled:text-[#76786d] text-[#2a3416] font-bold py-3 rounded-lg text-sm transition-all flex items-center justify-center gap-2 mt-2 shadow-md active:scale-[0.98] disabled:cursor-not-allowed"
                    >
                      {isLoggingIn ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin" />
                          Autenticando...
                        </>
                      ) : (
                        <>
                          <Shield className="w-4 h-4" />
                          Acessar Sistema
                        </>
                      )}
                    </button>
                  </form>

                  {/* Demonstration Quick Bypass Block */}
                  <div className="mt-6 pt-4 border-t border-[#45483e]/50 text-center">
                    <p className="text-[11px] text-[#76786d] mb-2">Para fins de demonstração, clique abaixo:</p>
                    <button
                      onClick={handleAutoFillLogin}
                      className="text-xs bg-[#3b4626] text-[#bfcca1] border border-[#bfcca1]/30 hover:border-[#bfcca1] px-3 py-1.5 rounded-full transition-all"
                    >
                      Preencher Credenciais Oficiais
                    </button>
                  </div>
                </div>

                <div className="text-center mt-6 text-[10px] text-[#76786d] px-6">
                  Uso restrito à Secretaria de Segurança Pública. Todo acesso e ações executadas ficam registrados em log operacional.
                </div>
              </motion.div>
            )}

            {/* ----------------- SEARCH/DASHBOARD VIEW ----------------- */}
            {currentView === "search" && isLoggedIn && (
              <motion.div
                key="search"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="space-y-5"
              >
                {/* Search Bar Block */}
                <div className="space-y-1">
                  <h2 className="text-xl font-bold text-[#e3e3dc] tracking-tight">Buscar Colaborador</h2>
                  <p className="text-xs text-[#c6c7bb]">
                    Pesquise por nome do proprietário, nome da fazenda ou CPF/CNPJ cadastrado.
                  </p>
                </div>

                {/* Styled Input */}
                <div className="relative">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#bfcca1] w-5 h-5" />
                  <input
                    type="text"
                    placeholder="Ex: João da Silva, Fazenda Esperança..."
                    value={searchQuery}
                    onChange={handleSearchChange}
                    className="w-full bg-[#1a1c18] border-2 border-[#45483e] focus:border-[#bfcca1] rounded-lg pl-11 pr-4 py-3.5 text-sm text-[#e3e3dc] placeholder-[#76786d] outline-none transition-all shadow-md"
                  />
                  {searchQuery && (
                    <button 
                      onClick={() => { setSearchQuery(""); refreshPropertiesList(""); }}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[#ffb4ac] hover:underline"
                    >
                      Limpar
                    </button>
                  )}
                </div>

                {/* Filter Quick Chips */}
                <div className="flex gap-2 overflow-x-auto pb-1 -mx-4 px-4 scrollbar-none snap-x">
                  <button
                    onClick={() => setActiveFilter("todos")}
                    className={`snap-start shrink-0 px-4 py-2 rounded-full text-xs font-semibold border transition-all flex items-center gap-1.5 ${
                      activeFilter === "todos" 
                        ? "bg-[#3b4626] border-[#bfcca1] text-[#bfcca1]" 
                        : "bg-[#1a1c18] border-[#45483e] text-[#c6c7bb]"
                    }`}
                  >
                    <MapPinned className="w-3.5 h-3.5" />
                    Todos ({propertiesList.length})
                  </button>

                  <button
                    onClick={() => setActiveFilter("colaborativos")}
                    className={`snap-start shrink-0 px-4 py-2 rounded-full text-xs font-semibold border transition-all flex items-center gap-1.5 ${
                      activeFilter === "colaborativos" 
                        ? "bg-[#3b4626] border-[#bfcca1] text-[#bfcca1]" 
                        : "bg-[#1a1c18] border-[#45483e] text-[#c6c7bb]"
                    }`}
                  >
                    <Shield className="w-3.5 h-3.5" />
                    Colaborativos ({propertiesList.filter(p => p.collaborativeOwner).length})
                  </button>
                </div>

                {/* Search Results List */}
                <section className="space-y-3">
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-[#bfcca1] flex items-center gap-1.5">
                    <span>Resultados da Busca</span>
                    <span className="text-[10px] bg-[#1a1c18] border border-[#45483e] px-1.5 py-0.5 rounded text-[#c6c7bb]">
                      {filteredProperties.length}
                    </span>
                  </h3>

                  {filteredProperties.length > 0 ? (
                    <div className="space-y-3">
                      {(showAllProperties ? filteredProperties : filteredProperties.slice(0, 5)).map((prop) => (
                        <div
                          key={prop.id}
                          onClick={() => {
                            if (prop.id !== undefined) {
                              setSelectedPropertyId(prop.id);
                              setCurrentView("details");
                              addToRecentSearches(prop);
                            }
                          }}
                          className="bg-[#1a1c18] hover:bg-[#20231f] border border-[#45483e] hover:border-[#bfcca1]/60 rounded-xl p-4 transition-all duration-150 cursor-pointer flex gap-4 relative shadow-sm"
                        >
                          {/* Left thumbnail */}
                          <div className="w-16 h-16 rounded-lg overflow-hidden shrink-0 bg-[#121410] border border-[#45483e] relative">
                            <img 
                              src={prop.photos[0] || `https://picsum.photos/seed/${prop.id}/150/150`} 
                              alt={prop.name} 
                              className="w-full h-full object-cover"
                            />
                          </div>

                          {/* Details column */}
                          <div className="flex-1 min-w-0 flex flex-col justify-between">
                            <div>
                              <div className="flex items-center justify-between">
                                <h4 className="font-bold text-sm text-[#e3e3dc] truncate pr-2">{prop.name}</h4>
                                {prop.collaborativeOwner && (
                                  <span className="text-[9px] bg-[#3b4626] text-[#bfcca1] font-mono px-1 rounded border border-[#bfcca1]/30">
                                    Colab
                                  </span>
                                )}
                              </div>
                              <p className="text-xs text-[#c6c7bb] font-medium truncate mt-0.5">
                                Prop: <span className="text-[#e3e3dc]">{prop.ownerName}</span>
                              </p>
                              <p className="text-[11px] text-[#76786d] truncate mt-0.5 flex items-center gap-0.5">
                                <MapPin className="w-3 h-3 text-[#bfcca1]" />
                                {prop.referencePoint || prop.municipality}
                              </p>
                            </div>

                            <p className="text-[10px] font-mono text-[#76786d] text-right mt-1.5">
                              Patrulha: {prop.lastPatrol || "Sem registro"}
                            </p>
                          </div>
                        </div>
                      ))}

                      {filteredProperties.length > 5 && (
                        <div className="flex justify-center pt-1.5 pb-0.5">
                          <button
                            onClick={() => setShowAllProperties(!showAllProperties)}
                            className="w-full bg-[#1a1c18] hover:bg-[#20231f] border border-[#45483e] hover:border-[#bfcca1]/50 text-[#bfcca1] text-xs font-bold py-2.5 rounded-lg transition-all duration-150 flex items-center justify-center gap-1.5 shadow-sm cursor-pointer"
                          >
                            {showAllProperties ? "Mostrar Menos" : `Ver Todas (${filteredProperties.length})`}
                          </button>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="bg-[#1a1c18] border border-dashed border-[#45483e] rounded-xl p-8 text-center space-y-2">
                      <AlertTriangle className="w-8 h-8 text-[#ffb4ac] mx-auto opacity-70" />
                      <p className="text-sm text-[#e3e3dc] font-semibold">Nenhuma propriedade encontrada</p>
                      <p className="text-xs text-[#76786d] max-w-xs mx-auto">
                        Tente pesquisar por outro termo ou cadastre esta nova propriedade clicando na aba abaixo.
                      </p>
                      <button
                        onClick={() => setCurrentView("create")}
                        className="bg-[#bfcca1] hover:bg-[#dbe8bc] text-[#2a3416] text-xs font-bold px-4 py-2 rounded-lg transition-all mt-2"
                      >
                        Cadastrar Nova Propriedade
                      </button>
                    </div>
                  )}
                </section>

                {/* Recent Searches / Fast triggers */}
                {recentSearches.length > 0 && !searchQuery && (
                  <section className="space-y-2">
                    <h3 className="text-xs font-semibold uppercase tracking-wider text-[#bfcca1]">Buscas Recentes</h3>
                    <div className="bg-[#1a1c18] border border-[#45483e] rounded-xl divide-y divide-[#45483e]/50 overflow-hidden">
                      {recentSearches.map((item, index) => (
                        <div
                          key={index}
                          onClick={() => handleRecentSearchTap(item.name, item)}
                          className="p-3 hover:bg-[#20231f] transition-all cursor-pointer flex items-center justify-between text-xs"
                        >
                          <div className="flex items-center gap-3">
                            <span className="text-[#bfcca1]">
                              {item.type === "property" ? <Map className="w-4 h-4" /> : <User className="w-4 h-4" />}
                            </span>
                            <div>
                              <p className="font-semibold text-[#e3e3dc]">{item.name}</p>
                              <p className="text-[10px] text-[#76786d]">{item.subtitle}</p>
                            </div>
                          </div>
                          <span className="text-[10px] font-mono text-[#76786d]">Consultar</span>
                        </div>
                      ))}
                    </div>
                  </section>
                )}

                {/* Region Map Live Satellite */}
                <section className="space-y-2">
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-[#bfcca1] flex items-center gap-1">
                    <Map className="w-4 h-4" />
                    Radar de Patrulha / Mapa (Seridó Potiguar)
                  </h3>
                  <div className="relative h-64 rounded-xl overflow-hidden border border-[#45483e] shadow-inner">
                    <SeridoMap 
                      properties={allProperties}
                      onSelectProperty={async (id) => {
                        setSelectedPropertyId(id);
                        setCurrentView("details");
                        const prop = await getPropertyById(id);
                        if (prop) {
                          addToRecentSearches(prop);
                        }
                      }}
                    />
                    
                    <div className="absolute bottom-3 right-3 flex gap-1.5 z-[400] pointer-events-none">
                      <span className="text-[9px] bg-[#1a1c18]/90 px-2 py-0.5 rounded border border-[#bfcca1]/30 font-mono text-[#bfcca1] shadow-md uppercase">
                        Satelite ON / Seridó RN
                      </span>
                    </div>
                  </div>
                </section>
              </motion.div>
            )}

            {/* ----------------- PROPERTY DETAILS VIEW ----------------- */}
            {currentView === "details" && isLoggedIn && selectedProperty && (
              <motion.div
                key="details"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-4"
              >
                {/* Navigation and Edit Actions */}
                <div className="flex items-center justify-between gap-2">
                  <button
                    onClick={() => {
                      setSelectedPropertyId(null);
                      setCurrentView("search");
                    }}
                    className="flex items-center gap-1.5 text-xs font-semibold text-[#bfcca1] hover:text-[#dbe8bc] bg-[#1a1c18] border border-[#45483e] px-3 py-2 rounded-lg transition-all"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    Voltar
                  </button>

                  <button
                    onClick={() => {
                      setIsEditing(true);
                      setFormData({
                        name: selectedProperty.name,
                        municipality: selectedProperty.municipality,
                        referencePoint: selectedProperty.referencePoint || "",
                        gpsCoordinates: selectedProperty.gpsCoordinates,
                        ownerName: selectedProperty.ownerName,
                        cpf: selectedProperty.cpf,
                        birthDate: selectedProperty.birthDate,
                        contactPhone: selectedProperty.contactPhone,
                        collaborativeOwner: selectedProperty.collaborativeOwner,
                        wifiName: selectedProperty.wifiName || "",
                        wifiPass: selectedProperty.wifiPass || "",
                        photo: selectedProperty.photos?.[0] || "",
                      });

                      // Parse residents list to display properly in editable field list
                      const parsedResidents = selectedProperty.residents.map(res => {
                        const match = res.match(/^(.*?)\s*\((.*?)\)$/);
                        if (match) {
                          return { name: match[1].trim(), relation: match[2].trim() };
                        }
                        return { name: res.trim(), relation: res.trim() === selectedProperty.ownerName ? "Proprietário" : "Morador" };
                      });
                      setResidents(parsedResidents);

                      setCurrentView("create");
                    }}
                    className="flex items-center gap-1.5 text-xs font-semibold text-[#bfcca1] hover:text-[#dbe8bc] bg-[#3b4626] border border-[#bfcca1]/30 hover:border-[#bfcca1] px-3 py-2 rounded-lg transition-all"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                    Editar Cadastro
                  </button>
                </div>

                {/* Property Main Image Cover */}
                <div className="w-full h-48 rounded-xl overflow-hidden relative border border-[#45483e] bg-[#1a1c18]">
                  <img
                    src={selectedProperty.photos[0]}
                    alt={selectedProperty.name}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent"></div>
                  
                  <div className="absolute bottom-4 left-4 right-4 flex items-end justify-between">
                    <div>
                      <h2 className="text-xl font-bold text-white tracking-tight">{selectedProperty.name}</h2>
                      <p className="text-xs text-[#c6c7bb] flex items-center gap-1 mt-0.5">
                        <MapPin className="w-3.5 h-3.5 text-[#bfcca1]" />
                        {selectedProperty.municipality}
                      </p>
                    </div>

                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold border flex items-center gap-1 shadow ${
                      selectedProperty.collaborativeOwner 
                        ? "bg-[#3b4626] text-[#bfcca1] border-[#bfcca1]/40" 
                        : "bg-[#1a1c18] text-[#c6c7bb] border-[#45483e]"
                    }`}>
                      <Shield className="w-3 h-3 shrink-0" />
                      {selectedProperty.collaborativeOwner ? "Colaborativo" : "Regular"}
                    </span>
                  </div>
                </div>

                {/* Reference address metadata */}
                <div className="bg-[#1a1c18] border border-[#45483e] rounded-xl p-4 space-y-2">
                  <h4 className="text-[10px] font-semibold text-[#bfcca1] uppercase tracking-wider">Como Chegar / Ponto de Referência</h4>
                  <p className="text-xs text-[#e3e3dc] leading-relaxed">
                    {selectedProperty.referencePoint || "Nenhum ponto de referência cadastrado."}
                  </p>
                  <div className="pt-2 border-t border-[#45483e]/40 flex items-center justify-between text-xs font-mono text-[#76786d]">
                    <span>Coordenadas GPS:</span>
                    <span className="text-[#e3e3dc]">{selectedProperty.gpsCoordinates}</span>
                  </div>
                </div>

                {/* Owner Information Card */}
                <div className="bg-[#1a1c18] border border-[#45483e] rounded-xl p-4 space-y-3">
                  <div className="flex items-center gap-3 border-b border-[#45483e]/40 pb-2">
                    <div className="w-8 h-8 rounded-full bg-[#3b4626] flex items-center justify-center text-[#bfcca1]">
                      <User className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="font-bold text-sm text-[#e3e3dc]">{selectedProperty.ownerName}</h3>
                      <p className="text-[10px] text-[#c6c7bb]">Proprietário Responsável</p>
                    </div>
                  </div>

                  <div className="space-y-2 text-xs font-medium">
                    <div className="flex justify-between">
                      <span className="text-[#76786d]">CPF:</span>
                      <span className="text-[#e3e3dc] font-mono">{selectedProperty.cpf}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#76786d]">Nascimento:</span>
                      <span className="text-[#e3e3dc]">{selectedProperty.birthDate.split("-").reverse().join("/")}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#76786d]">Contato Principal:</span>
                      <span className="text-[#bfcca1] font-semibold flex items-center gap-1 font-mono">
                        <Phone className="w-3 h-3" />
                        {selectedProperty.contactPhone}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Permanent Residents and Patrol Logs */}
                <div className="grid grid-cols-1 gap-3">
                  <div className="bg-[#1a1c18] border border-[#45483e] rounded-xl p-4 space-y-3">
                    <h4 className="text-[10px] font-semibold text-[#bfcca1] uppercase tracking-wider flex items-center justify-between">
                      <span>Residentes Permanentes</span>
                      <span className="text-xs font-bold text-[#e3e3dc]">{selectedProperty.residents.length}</span>
                    </h4>
                    
                    <div className="space-y-1">
                      {selectedProperty.residents.map((res, i) => {
                        const match = res.match(/^(.*?)\s*\((.*?)\)$/);
                        const name = match ? match[1].trim() : res.trim();
                        const relation = match ? match[2].trim() : (name === selectedProperty.ownerName ? "Proprietário" : "Morador");
                        return (
                          <div key={i} className="flex justify-between items-center py-2 border-b border-[#45483e]/30 last:border-0">
                            <span className="text-xs text-[#e3e3dc] font-medium">{name}</span>
                            <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border tracking-wide uppercase ${
                              relation.toLowerCase() === "proprietário" || relation.toLowerCase() === "proprietario"
                                ? "bg-[#3b4626] text-[#bfcca1] border-[#bfcca1]/20" 
                                : "bg-[#1d1f1a] text-[#c6c7bb] border-[#45483e]"
                            }`}>
                              {relation}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Connectivity Specs */}
                  {selectedProperty.wifiName && (
                    <div className="bg-[#1a1c18] border border-[#45483e] rounded-xl p-4 space-y-2">
                      <h4 className="text-[10px] font-semibold text-[#bfcca1] uppercase tracking-wider flex items-center gap-1.5">
                        <Wifi className="w-3.5 h-3.5" />
                        Conectividade / Wi-Fi da Sede
                      </h4>
                      <div className="text-xs space-y-1.5 font-mono">
                        <div className="flex justify-between">
                          <span className="text-[#76786d]">Rede:</span>
                          <span className="text-[#e3e3dc] font-bold">{selectedProperty.wifiName}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-[#76786d]">Senha:</span>
                          <span className="text-[#bfcca1] font-bold">{selectedProperty.wifiPass}</span>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="bg-[#1a1c18] border border-[#45483e] rounded-xl p-4 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Shield className="w-5 h-5 text-[#bfcca1] shrink-0" />
                      <span className="text-xs text-[#c6c7bb] font-semibold">Última Patrulha:</span>
                    </div>
                    <span className="text-xs font-mono font-semibold text-[#e3e3dc]">
                      {selectedProperty.lastPatrol || "Não registrado"}
                    </span>
                  </div>
                </div>

                {/* Google Maps Actions */}
                <div className="space-y-3 pt-2">
                  <a
                    href={`https://www.google.com/maps/dir/?api=1&destination=${selectedProperty.gpsCoordinates.replace(/\s+/g, "")}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full bg-[#bfcca1] hover:bg-[#dbe8bc] text-[#2a3416] font-bold h-12 rounded-lg flex items-center justify-center gap-2 transition-all shadow-md"
                  >
                    <Map className="w-4 h-4 shrink-0" />
                    Abrir Rota no Google Maps
                  </a>

                  {/* QR Code Simulation Block */}
                  <div className="bg-[#1a1c18] border border-[#45483e] rounded-xl p-4 text-center space-y-2.5">
                    <p className="text-[10px] uppercase font-bold text-[#c6c7bb] tracking-wider">
                      Placa de Identificação da Sede (QR-CODE)
                    </p>
                    <div className="bg-white p-3 rounded-xl inline-block shadow-md">
                      <QRCodeSVG
                        value={`https://www.google.com/maps/dir/?api=1&destination=${selectedProperty.gpsCoordinates.replace(/\s+/g, "")}`}
                        size={140}
                        level="M"
                        includeMargin={false}
                      />
                    </div>
                    <p className="text-[10px] text-[#76786d] max-w-xs mx-auto">
                      Esta imagem do QR-Code pode ser impressa para compor a placa rural ou escaneada por outra viatura para abrir a rota de GPS idêntica no Google Maps de imediato.
                    </p>
                  </div>

                  {/* Danger/Delete zone */}
                  <div className="pt-2">
                    <button
                      onClick={() => {
                        setPropertyToDelete(selectedProperty);
                      }}
                      className="w-full bg-transparent hover:bg-[#69000c]/10 text-[#ffb4ac] border border-[#69000c] text-xs font-semibold py-2.5 rounded-lg transition-all"
                    >
                      Excluir Cadastro do Banco de Dados
                    </button>
                  </div>
                </div>
              </motion.div>
            )}

            {/* ----------------- CREATE/NEW REGISTRY VIEW ----------------- */}
            {currentView === "create" && isLoggedIn && (
              <motion.div
                key="create"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="space-y-4"
              >
                <div className="space-y-1">
                  <h2 className="text-xl font-bold text-[#e3e3dc] tracking-tight">
                    {isEditing ? "Editar Propriedade" : "Cadastro de Propriedade"}
                  </h2>
                  <p className="text-xs text-[#c6c7bb]">
                    {isEditing 
                      ? "Atualize as informações cadastrais do imóvel rural de forma segura."
                      : "Registre uma nova propriedade rural para patrulhamento georreferenciado."}
                  </p>
                </div>

                <form onSubmit={handleSavePropertyForm} className="space-y-5 pb-6">
                  
                  {/* Property Info Subform */}
                  <fieldset className="bg-[#1a1c18] border border-[#45483e] rounded-xl p-4 space-y-4">
                    <legend className="text-xs font-bold text-[#bfcca1] px-2 uppercase tracking-widest bg-[#121410] border border-[#45483e] rounded py-0.5">
                      Informações da Sede
                    </legend>

                    <div className="space-y-1">
                      <label htmlFor="pname" className="text-xs font-semibold text-[#c6c7bb] block">
                        Nome da Propriedade <span className="text-[#ffb4ac]">*</span>
                      </label>
                      <input 
                        type="text" 
                        id="pname"
                        placeholder="Ex: Fazenda Boa Esperança"
                        value={formData.name}
                        onChange={(e) => handleFormFieldChange("name", e.target.value)}
                        className="w-full bg-[#121410] border-2 border-[#45483e] focus:border-[#bfcca1] rounded-lg px-3 py-2.5 text-xs text-[#e3e3dc] outline-none transition-all placeholder-[#76786d]"
                        required
                      />
                    </div>

                    <div className="space-y-1">
                      <label htmlFor="municip" className="text-xs font-semibold text-[#c6c7bb] block">
                        Município
                      </label>
                      <input 
                        type="text" 
                        id="municip"
                        placeholder="Nome do Município"
                        value={formData.municipality}
                        onChange={(e) => handleFormFieldChange("municipality", e.target.value)}
                        className="w-full bg-[#121410] border-2 border-[#45483e] focus:border-[#bfcca1] rounded-lg px-3 py-2.5 text-xs text-[#e3e3dc] outline-none transition-all placeholder-[#76786d]"
                      />
                    </div>

                    <div className="space-y-1">
                      <label htmlFor="refpoint" className="text-xs font-semibold text-[#c6c7bb] block">
                        Ponto de Referência / Como Chegar
                      </label>
                      <textarea 
                        id="refpoint"
                        placeholder="Ex: Estrada Vicinal KM 12, entrada após a ponte de madeira..."
                        rows={2}
                        value={formData.referencePoint}
                        onChange={(e) => handleFormFieldChange("referencePoint", e.target.value)}
                        className="w-full bg-[#121410] border-2 border-[#45483e] focus:border-[#bfcca1] rounded-lg p-3 text-xs text-[#e3e3dc] outline-none transition-all placeholder-[#76786d] resize-none"
                      />
                    </div>

                    {/* Geolocation Input */}
                    <div className="space-y-2">
                      <label htmlFor="coords" className="text-xs font-semibold text-[#c6c7bb] block">
                        Coordenadas GPS (Latitude, Longitude)
                      </label>
                      <div className="flex gap-2">
                        <input 
                          type="text" 
                          id="coords"
                          placeholder="Ex: -25.1234, -50.1234"
                          value={formData.gpsCoordinates}
                          onChange={(e) => handleFormFieldChange("gpsCoordinates", e.target.value)}
                          className="flex-1 bg-[#121410] border-2 border-[#45483e] focus:border-[#bfcca1] rounded-lg px-3 py-2.5 text-xs font-mono text-[#e3e3dc] outline-none transition-all placeholder-[#76786d]"
                        />
                        <button
                          type="button"
                          onClick={handleGetLocation}
                          disabled={isLocating}
                          className="px-3 py-2 bg-[#3b4626] border border-[#bfcca1]/30 hover:border-[#bfcca1] text-[#bfcca1] text-xs font-semibold rounded-lg flex items-center gap-1 shrink-0 transition-all active:scale-95 disabled:opacity-50"
                        >
                          <MapPin className="w-3.5 h-3.5" />
                          {isLocating ? "Obtendo..." : "Obter Atual"}
                        </button>
                      </div>
                      <p className="text-[10px] text-[#76786d]">
                        Selecione &quot;Obter Atual&quot; para consultar as coordenadas exatas da viatura no local usando o receptor GPS do dispositivo.
                      </p>
                    </div>
                  </fieldset>

                  {/* Photo Upload Subform */}
                  <fieldset className="bg-[#1a1c18] border border-[#45483e] rounded-xl p-4 space-y-4">
                    <legend className="text-xs font-bold text-[#bfcca1] px-2 uppercase tracking-widest bg-[#121410] border border-[#45483e] rounded py-0.5 flex items-center gap-1">
                      <Camera className="w-3.5 h-3.5 text-[#bfcca1]" />
                      Foto do Imóvel
                    </legend>

                    <div className="space-y-3">
                      {/* Live preview */}
                      <div className="w-full h-44 rounded-lg overflow-hidden bg-[#121410] border-2 border-[#45483e] flex flex-col items-center justify-center relative">
                        {formData.photo ? (
                          <>
                            <img src={formData.photo} alt="Preview" className="w-full h-full object-cover" />
                            <button
                              type="button"
                              onClick={() => handleFormFieldChange("photo", "")}
                              className="absolute top-2 right-2 bg-black/75 hover:bg-black text-[#ffb4ac] hover:text-white p-2 rounded-full transition-all active:scale-90"
                              title="Remover Foto"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </>
                        ) : (
                          <div className="text-center p-4 text-[#76786d]">
                            <Camera className="w-8 h-8 mx-auto mb-1 opacity-60 text-[#bfcca1]" />
                            <p className="text-xs font-semibold">Nenhuma foto enviada</p>
                            <p className="text-[10px] mt-1">Carregue um arquivo local ou informe um link abaixo</p>
                          </div>
                        )}
                      </div>

                      {/* File Input and URL option */}
                      <div className="space-y-3">
                        <div>
                          <label className="w-full flex items-center justify-center bg-[#3b4626] border border-[#bfcca1]/30 hover:border-[#bfcca1] text-[#bfcca1] text-xs font-bold py-2.5 rounded-lg cursor-pointer transition-all active:scale-[0.98] text-center">
                            <Upload className="w-3.5 h-3.5 mr-2" />
                            Tirar Foto ou Carregar Arquivo
                            <input
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) {
                                  const reader = new FileReader();
                                  reader.onloadend = () => {
                                    handleFormFieldChange("photo", reader.result as string);
                                    showSuccessFeedback("Foto carregada com sucesso!");
                                  };
                                  reader.readAsDataURL(file);
                                }
                              }}
                            />
                          </label>
                          <p className="text-[10px] text-[#76786d] mt-1 text-center">
                            Ideal para funcionamento offline. A foto será salva localmente no banco IndexedDB.
                          </p>
                        </div>

                        <div className="flex gap-2 items-center">
                          <span className="text-[10px] text-[#76786d] uppercase font-extrabold shrink-0">Ou URL:</span>
                          <input
                            type="url"
                            placeholder="Ex: https://imagens.com/minha-fazenda.jpg"
                            value={formData.photo.startsWith("data:") ? "" : formData.photo}
                            onChange={(e) => handleFormFieldChange("photo", e.target.value)}
                            className="flex-1 bg-[#121410] border-2 border-[#45483e] focus:border-[#bfcca1] rounded-lg px-3 py-1.5 text-xs text-[#e3e3dc] outline-none transition-all placeholder-[#76786d]"
                          />
                        </div>
                      </div>
                    </div>
                  </fieldset>

                  {/* Owner Info Subform */}
                  <fieldset className="bg-[#1a1c18] border border-[#45483e] rounded-xl p-4 space-y-4">
                    <div className="flex items-center justify-between border-b border-[#45483e]/40 pb-2 mb-2">
                      <legend className="text-xs font-bold text-[#bfcca1] uppercase tracking-widest">
                        Dados do Proprietário
                      </legend>
                      
                      {/* Toggle Collaborative */}
                      <label className="flex items-center gap-2 cursor-pointer">
                        <span className="text-[10px] text-[#c6c7bb] font-bold uppercase tracking-wider">Colaborador</span>
                        <div className="relative inline-block w-9 align-middle select-none transition duration-200 ease-in">
                          <input 
                            type="checkbox" 
                            name="toggle" 
                            id="colab-toggle"
                            checked={formData.collaborativeOwner}
                            onChange={(e) => handleFormFieldChange("collaborativeOwner", e.target.checked)}
                            className="sr-only"
                          />
                          <div className={`w-9 h-5 rounded-full transition-colors ${formData.collaborativeOwner ? "bg-[#bfcca1]" : "bg-[#45483e]"}`}></div>
                          <div className={`absolute left-0.5 top-0.5 bg-[#121410] w-4 h-4 rounded-full transition-transform duration-200 ${formData.collaborativeOwner ? "translate-x-4" : "translate-x-0"}`}></div>
                        </div>
                      </label>
                    </div>

                    <div className="space-y-1">
                      <label htmlFor="owner" className="text-xs font-semibold text-[#c6c7bb] block">
                        Nome Completo <span className="text-[#ffb4ac]">*</span>
                      </label>
                      <input 
                        type="text" 
                        id="owner"
                        placeholder="Nome completo do proprietário"
                        value={formData.ownerName}
                        onChange={(e) => handleFormFieldChange("ownerName", e.target.value)}
                        className="w-full bg-[#121410] border-2 border-[#45483e] focus:border-[#bfcca1] rounded-lg px-3 py-2.5 text-xs text-[#e3e3dc] outline-none transition-all placeholder-[#76786d]"
                        required
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label htmlFor="owner-cpf" className="text-xs font-semibold text-[#c6c7bb] block">
                          CPF
                        </label>
                        <input 
                          type="text" 
                          id="owner-cpf"
                          placeholder="000.000.000-00"
                          value={formData.cpf}
                          onChange={(e) => handleFormFieldChange("cpf", e.target.value)}
                          className="w-full bg-[#121410] border-2 border-[#45483e] focus:border-[#bfcca1] rounded-lg px-3 py-2.5 text-xs font-mono text-[#e3e3dc] outline-none transition-all placeholder-[#76786d]"
                        />
                      </div>

                      <div className="space-y-1">
                        <label htmlFor="owner-birth" className="text-xs font-semibold text-[#c6c7bb] block">
                          Nascimento
                        </label>
                        <input 
                          type="date" 
                          id="owner-birth"
                          value={formData.birthDate}
                          onChange={(e) => handleFormFieldChange("birthDate", e.target.value)}
                          className="w-full bg-[#121410] border-2 border-[#45483e] focus:border-[#bfcca1] rounded-lg px-3 py-2 text-xs text-[#e3e3dc] outline-none transition-all"
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label htmlFor="owner-phone" className="text-xs font-semibold text-[#c6c7bb] block">
                        Telefone Principal de Contato
                      </label>
                      <input 
                        type="tel" 
                        id="owner-phone"
                        placeholder="(00) 00000-0000"
                        value={formData.contactPhone}
                        onChange={(e) => handleFormFieldChange("contactPhone", e.target.value)}
                        className="w-full bg-[#121410] border-2 border-[#45483e] focus:border-[#bfcca1] rounded-lg px-3 py-2.5 text-xs font-mono text-[#e3e3dc] outline-none transition-all placeholder-[#76786d]"
                      />
                    </div>
                  </fieldset>

                  {/* Connectivity Specs Subform */}
                  <fieldset className="bg-[#1a1c18] border border-[#45483e] rounded-xl p-4 space-y-4">
                    <legend className="text-xs font-bold text-[#bfcca1] px-2 uppercase tracking-widest bg-[#121410] border border-[#45483e] rounded py-0.5 flex items-center gap-1">
                      <Wifi className="w-3.5 h-3.5 text-[#bfcca1]" />
                      Conectividade / Wi-Fi Sede
                    </legend>
                    <p className="text-[10px] text-[#76786d]">
                      Se disponível, cadastre os dados de rede para apoio e comunicação de emergência das viaturas no pátio da sede.
                    </p>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label htmlFor="wifi-name" className="text-xs font-semibold text-[#c6c7bb] block">
                          Nome da Rede (SSID)
                        </label>
                        <input 
                          type="text" 
                          id="wifi-name"
                          placeholder="Ex: Sede_Esperanca"
                          value={formData.wifiName}
                          onChange={(e) => handleFormFieldChange("wifiName", e.target.value)}
                          className="w-full bg-[#121410] border-2 border-[#45483e] focus:border-[#bfcca1] rounded-lg px-3 py-2.5 text-xs text-[#e3e3dc] outline-none transition-all placeholder-[#76786d]"
                        />
                      </div>

                      <div className="space-y-1">
                        <label htmlFor="wifi-pass" className="text-xs font-semibold text-[#c6c7bb] block">
                          Senha da Rede
                        </label>
                        <input 
                          type="text" 
                          id="wifi-pass"
                          placeholder="Senha de acesso"
                          value={formData.wifiPass}
                          onChange={(e) => handleFormFieldChange("wifiPass", e.target.value)}
                          className="w-full bg-[#121410] border-2 border-[#45483e] focus:border-[#bfcca1] rounded-lg px-3 py-2.5 text-xs text-[#e3e3dc] outline-none transition-all placeholder-[#76786d]"
                        />
                      </div>
                    </div>
                  </fieldset>

                  {/* Residents Subform */}
                  <fieldset className="bg-[#1a1c18] border border-[#45483e] rounded-xl p-4 space-y-3">
                    <legend className="text-xs font-bold text-[#bfcca1] px-2 uppercase tracking-widest bg-[#121410] border border-[#45483e] rounded py-0.5 flex items-center gap-1">
                      <Users className="w-3.5 h-3.5 text-[#bfcca1]" />
                      Moradores Permanentes
                    </legend>

                    {/* Form elements to add residents */}
                    <div className="space-y-2 pb-2 border-b border-[#45483e]/30">
                      <div className="grid grid-cols-2 gap-2">
                        <input 
                          type="text" 
                          placeholder="Nome Completo"
                          value={newResidentName}
                          onChange={(e) => setNewResidentName(e.target.value)}
                          className="bg-[#121410] border border-[#45483e] focus:border-[#bfcca1] rounded-lg px-2 py-2 text-xs text-[#e3e3dc] outline-none"
                        />
                        <input 
                          type="text" 
                          placeholder="Grau (ex: Filha, Esposa)"
                          value={newResidentRelation}
                          onChange={(e) => setNewResidentRelation(e.target.value)}
                          className="bg-[#121410] border border-[#45483e] focus:border-[#bfcca1] rounded-lg px-2 py-2 text-xs text-[#e3e3dc] outline-none"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={handleAddResident}
                        className="w-full bg-[#3b4626] border border-[#bfcca1]/30 hover:border-[#bfcca1] text-[#bfcca1] text-xs font-semibold py-1.5 rounded-lg flex items-center justify-center gap-1 transition-all active:scale-[0.98]"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        Adicionar Morador
                      </button>
                    </div>

                    {/* Resident list display */}
                    <div className="space-y-2 mt-2">
                      {residents.length > 0 ? (
                        <div className="divide-y divide-[#45483e]/40 border border-[#45483e] rounded-lg overflow-hidden bg-[#121410]">
                          {residents.map((res, index) => (
                            <div key={index} className="p-2.5 flex items-center justify-between text-xs">
                              <div>
                                <p className="font-semibold text-[#e3e3dc]">{res.name}</p>
                                <p className="text-[10px] text-[#76786d]">{res.relation}</p>
                              </div>
                              <button
                                type="button"
                                onClick={() => handleRemoveResident(index)}
                                className="p-1.5 hover:bg-[#69000c]/20 text-[#ffb4ac] hover:text-[#ffdad6] rounded transition-colors"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-center text-[11px] text-[#76786d] py-3">
                          Nenhum morador adicional cadastrado. O proprietário será adicionado por padrão.
                        </p>
                      )}
                    </div>
                  </fieldset>

                  {/* Actions buttons */}
                  <div className="flex gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => {
                        // Clear form
                        setFormData({
                          name: "",
                          municipality: "Município X",
                          referencePoint: "",
                          gpsCoordinates: "",
                          ownerName: "",
                          cpf: "",
                          birthDate: "",
                          contactPhone: "",
                          collaborativeOwner: true,
                          wifiName: "",
                          wifiPass: "",
                          photo: "",
                        });
                        setResidents([]);
                        if (isEditing) {
                          setIsEditing(false);
                          setCurrentView("details");
                        } else {
                          setCurrentView("search");
                        }
                      }}
                      className="flex-1 bg-transparent hover:bg-[#45483e]/20 border border-[#45483e] text-[#c6c7bb] text-xs font-bold py-3 rounded-lg transition-all"
                    >
                      Cancelar
                    </button>

                    <button
                      type="submit"
                      className="flex-[2] bg-[#bfcca1] hover:bg-[#dbe8bc] text-[#2a3416] text-xs font-bold py-3 rounded-lg transition-all shadow-md active:scale-[0.98]"
                    >
                      {isEditing ? "Salvar Alterações" : "Salvar Cadastro Sede"}
                    </button>
                  </div>

                </form>
              </motion.div>
            )}

            {/* ----------------- SUPABASE VIEW ----------------- */}
            {currentView === "supabase" && isLoggedIn && (
              <motion.div
                key="supabase"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                className="space-y-5 pb-6 text-[#e3e3dc]"
              >
                {/* Header Section */}
                <div className="space-y-1">
                  <h2 className="text-xl font-bold text-[#e3e3dc] tracking-tight">Sincronização Nuvem</h2>
                  <p className="text-xs text-[#c6c7bb]">
                    Configure e sincronize os cadastros de patrulha rural com o banco de dados Supabase.
                  </p>
                </div>

                {/* Connection Status Card */}
                <div className="bg-[#1a1c18] border border-[#45483e] rounded-xl p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono text-[#c6c7bb]">STATUS DA CONEXÃO</span>
                    {isCheckingSupabase ? (
                      <span className="inline-flex items-center gap-1.5 text-xs text-[#bfcca1] font-mono">
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Verificando...
                      </span>
                    ) : supabaseStatus?.connected ? (
                      supabaseStatus.tableExists ? (
                        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] bg-[#3b4626] text-[#bfcca1] border border-[#bfcca1]/20 font-bold uppercase tracking-wider">
                          <CheckCircle className="w-3 h-3 text-[#bfcca1]" /> Conectado
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] bg-[#695d00]/20 text-[#ffe259] border border-[#ffe259]/20 font-bold uppercase tracking-wider">
                          <AlertTriangle className="w-3 h-3 text-[#ffe259]" /> Tabela Pendente
                        </span>
                      )
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] bg-[#690007]/20 text-[#ffb4ac] border border-[#ff8f85]/20 font-bold uppercase tracking-wider">
                        <AlertTriangle className="w-3 h-3 text-[#ffb4ac]" /> Desconectado
                      </span>
                    )}
                  </div>

                  <div className="space-y-1 text-xs">
                    <div className="flex justify-between">
                      <span className="text-[#76786d]">Endpoint:</span>
                      <span className="font-mono text-white select-all truncate max-w-[200px]" title={supabaseStatus?.supabaseUrl || "https://frswlyctlykrnaorfoql.supabase.co"}>
                        {supabaseStatus?.supabaseUrl || "https://frswlyctlykrnaorfoql.supabase.co"}
                      </span>
                    </div>
                    {supabaseStatus?.connected && (
                      <div className="flex justify-between">
                        <span className="text-[#76786d]">Origem das Chaves:</span>
                        <span className="text-white">
                          {supabaseStatus.usingFallback ? "Padrão do Sistema" : "Variáveis de Ambiente (.env)"}
                        </span>
                      </div>
                    )}
                  </div>

                  {supabaseStatus?.message && (
                    <p className={`text-[11px] p-2 rounded border leading-relaxed ${
                      supabaseStatus.connected 
                        ? supabaseStatus.tableExists 
                          ? "bg-[#3b4626]/20 border-[#bfcca1]/20 text-[#c6c7bb]" 
                          : "bg-[#695d00]/10 border-[#ffe259]/20 text-[#ffe259]" 
                        : "bg-[#690007]/10 border-[#ff8f85]/20 text-[#ffb4ac]"
                    }`}>
                      {supabaseStatus.message}
                    </p>
                  )}

                  <button
                    onClick={() => checkSupabaseConnection()}
                    disabled={isCheckingSupabase}
                    className="w-full bg-[#2a2d28] hover:bg-[#343732] border border-[#45483e] text-[#c6c7bb] text-xs font-bold py-2 rounded-lg transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isCheckingSupabase ? "animate-spin" : ""}`} />
                    Testar Conexão Novamente
                  </button>
                </div>

                {/* Database Toggle (Source Selector) */}
                <div className="bg-[#1a1c18] border border-[#45483e] rounded-xl p-4 space-y-3">
                  <div className="space-y-0.5">
                    <h3 className="text-xs font-semibold uppercase tracking-wider text-[#bfcca1]">Banco de Dados Ativo</h3>
                    <p className="text-[10px] text-[#76786d]">Escolha de onde ler e onde gravar os novos cadastros.</p>
                  </div>

                  <div className="grid grid-cols-2 gap-2 p-1 bg-[#121410] rounded-lg border border-[#45483e]">
                    <button
                      onClick={() => {
                        setDbSource("local");
                        localStorage.setItem("patrulha_db_source", "local");
                        refreshPropertiesList("", "local");
                        showSuccessFeedback("Usando Banco de Dados Local (IndexedDB)");
                      }}
                      className={`py-2 px-3 rounded-md text-xs font-bold transition-all flex flex-col items-center gap-1 cursor-pointer ${
                        dbSource === "local"
                          ? "bg-[#3b4626] text-[#bfcca1] shadow-md border border-[#bfcca1]/20"
                          : "text-[#76786d] hover:text-[#c6c7bb]"
                      }`}
                    >
                      <Database className="w-4 h-4" />
                      <span>Local (IndexedDB)</span>
                    </button>

                    <button
                      onClick={() => {
                        if (supabaseStatus?.connected && supabaseStatus?.tableExists) {
                          setDbSource("supabase");
                          localStorage.setItem("patrulha_db_source", "supabase");
                          refreshPropertiesList("", "supabase");
                          showSuccessFeedback("Usando Banco de Dados Supabase (Nuvem)");
                        } else {
                          showErrorFeedback("Não é possível ativar o Supabase sem a tabela criada.");
                        }
                      }}
                      disabled={!supabaseStatus?.connected || !supabaseStatus?.tableExists}
                      className={`py-2 px-3 rounded-md text-xs font-bold transition-all flex flex-col items-center gap-1 cursor-pointer ${
                        dbSource === "supabase"
                          ? "bg-[#3b4626] text-[#bfcca1] shadow-md border border-[#bfcca1]/20"
                          : "text-[#76786d] hover:text-[#c6c7bb] disabled:opacity-40 disabled:cursor-not-allowed"
                      }`}
                    >
                      <Cloud className="w-4 h-4" />
                      <span>Supabase (Nuvem)</span>
                    </button>
                  </div>
                </div>

                {/* Synchronize Utilities */}
                <div className="bg-[#1a1c18] border border-[#45483e] rounded-xl p-4 space-y-4">
                  <div className="space-y-0.5">
                    <h3 className="text-xs font-semibold uppercase tracking-wider text-[#bfcca1]">Sincronização de Dados</h3>
                    <p className="text-[10px] text-[#76786d]">Transfira seus dados entre o navegador e a nuvem com um clique.</p>
                  </div>

                  {isSyncing && syncProgress.total > 0 && (
                    <div className="space-y-1.5 p-3 bg-[#121410] border border-[#45483e] rounded-lg">
                      <div className="flex justify-between text-[10px] font-mono text-[#c6c7bb]">
                        <span>{syncProgress.type === "push" ? "Enviando para nuvem..." : "Baixando para local..."}</span>
                        <span>{syncProgress.current} de {syncProgress.total} ({Math.round((syncProgress.current / syncProgress.total) * 100)}%)</span>
                      </div>
                      <div className="w-full bg-[#1a1c18] h-1.5 rounded-full overflow-hidden border border-[#45483e]/50">
                        <div 
                          className="bg-[#bfcca1] h-full transition-all duration-150" 
                          style={{ width: `${(syncProgress.current / syncProgress.total) * 100}%` }}
                        />
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-1 gap-2">
                    <button
                      onClick={syncLocalToSupabase}
                      disabled={isSyncing || !supabaseStatus?.connected || !supabaseStatus?.tableExists}
                      className="bg-[#1a1c18] hover:bg-[#20231f] border border-[#45483e] hover:border-[#bfcca1]/30 disabled:opacity-40 disabled:hover:bg-[#1a1c18] disabled:border-[#45483e] text-white text-xs font-bold py-3 px-4 rounded-lg transition-all flex items-center justify-between shadow-sm cursor-pointer"
                    >
                      <div className="flex items-center gap-2.5 text-left">
                        <CloudUpload className="w-4 h-4 text-[#bfcca1]" />
                        <div>
                          <p className="font-semibold text-xs text-[#bfcca1]">Enviar para a Nuvem</p>
                          <p className="text-[9px] text-[#76786d]">Envia todos os cadastros locais para o Supabase</p>
                        </div>
                      </div>
                    </button>

                    <button
                      onClick={syncSupabaseToLocal}
                      disabled={isSyncing || !supabaseStatus?.connected || !supabaseStatus?.tableExists}
                      className="bg-[#1a1c18] hover:bg-[#20231f] border border-[#45483e] hover:border-[#bfcca1]/30 disabled:opacity-40 disabled:hover:bg-[#1a1c18] disabled:border-[#45483e] text-white text-xs font-bold py-3 px-4 rounded-lg transition-all flex items-center justify-between shadow-sm cursor-pointer"
                    >
                      <div className="flex items-center gap-2.5 text-left">
                        <CloudDownload className="w-4 h-4 text-[#bfcca1]" />
                        <div>
                          <p className="font-semibold text-xs text-[#bfcca1]">Baixar para o Dispositivo</p>
                          <p className="text-[9px] text-[#76786d]">Importa todos os cadastros da nuvem para o IndexedDB</p>
                        </div>
                      </div>
                    </button>
                  </div>
                </div>

                {/* Reset Database Section */}
                <div className="bg-[#1a1c18] border border-[#690007]/30 rounded-xl p-4 space-y-3">
                  <div className="space-y-0.5">
                    <h3 className="text-xs font-semibold uppercase tracking-wider text-[#ffb4ac]">Zona de Perigo</h3>
                    <p className="text-[10px] text-[#76786d]">Apagar permanentemente todos os cadastros atuais para iniciar com imóveis reais.</p>
                  </div>

                  <button
                    onClick={clearAllData}
                    disabled={isClearing || isSyncing}
                    className="w-full bg-[#1a1c18] hover:bg-[#69000c]/10 border border-[#45483e] hover:border-[#ffb4ac]/30 text-[#ffb4ac] hover:text-[#ff8f85] text-xs font-bold py-3 px-4 rounded-lg transition-all flex items-center gap-2.5 cursor-pointer disabled:opacity-40"
                  >
                    <Trash2 className="w-4 h-4 text-[#ffb4ac]" />
                    <div className="text-left">
                      <p className="font-semibold text-xs text-[#ffb4ac]">Apagar Todos os Dados</p>
                      <p className="text-[9px] text-[#76786d]">Limpa o IndexedDB local e o banco de dados Supabase</p>
                    </div>
                  </button>
                </div>

                {/* SQL setup instructions */}
                {supabaseStatus?.connected && !supabaseStatus?.tableExists && (
                  <div className="bg-[#1a1c18] border border-[#695d00]/30 rounded-xl p-4 space-y-3">
                    <div className="flex items-center gap-2 text-[#ffe259]">
                      <AlertTriangle className="w-5 h-5 shrink-0" />
                      <h4 className="text-xs font-bold uppercase tracking-wide">Ação Necessária: Criar Tabela</h4>
                    </div>

                    <p className="text-[11px] text-[#c6c7bb] leading-relaxed">
                      Sua conta Supabase está conectada, mas a tabela <code className="bg-[#121410] px-1 py-0.5 rounded text-white text-[10px]">properties</code> não foi encontrada no banco.
                      Copie o código SQL abaixo, acesse o <strong>SQL Editor</strong> no painel do Supabase, cole e clique em <strong>Run</strong>:
                    </p>

                    <div className="relative mt-2 rounded-lg overflow-hidden border border-[#45483e] bg-[#121410]">
                      <div className="flex items-center justify-between px-3 py-1.5 bg-[#1a1c18] border-b border-[#45483e] text-[9px] font-mono text-[#76786d]">
                        <span>SCRIPT SQL DE INICIALIZAÇÃO</span>
                        <button
                          onClick={() => {
                            if (supabaseStatus?.sqlSchema) {
                              navigator.clipboard.writeText(supabaseStatus.sqlSchema);
                              showSuccessFeedback("Script SQL copiado com sucesso!");
                            }
                          }}
                          className="flex items-center gap-1 hover:text-[#bfcca1] transition-colors cursor-pointer"
                        >
                          <Copy className="w-3 h-3" /> Copiar Código
                        </button>
                      </div>
                      <pre className="p-3 text-[9px] font-mono text-[#e3e3dc] overflow-x-auto max-h-48 whitespace-pre scrollbar-thin">
                        {supabaseStatus?.sqlSchema}
                      </pre>
                    </div>
                  </div>
                )}
              </motion.div>
            )}

          </AnimatePresence>
        </main>

        {/* Global Bottom Tab Navigation Bar (Only if logged in) */}
        {isLoggedIn && currentView !== "login" && (
          <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md bg-[#1a1c18] border-t border-[#45483e] h-[72px] z-50 flex items-center justify-around pb-safe px-4 shadow-xl">
            <button
              onClick={() => {
                setSelectedPropertyId(null);
                setCurrentView("search");
              }}
              className={`flex flex-col items-center justify-center w-24 h-full text-center transition-all ${
                currentView === "search" || currentView === "details"
                  ? "text-[#bfcca1] font-bold"
                  : "text-[#76786d] hover:text-[#c6c7bb]"
              }`}
            >
              <Search className="w-5.5 h-5.5 mb-1" />
              <span className="text-[10px] tracking-wider uppercase">Início</span>
            </button>

            <button
              onClick={() => {
                setCurrentView("create");
              }}
              className={`flex flex-col items-center justify-center w-24 h-full text-center transition-all ${
                currentView === "create"
                  ? "text-[#bfcca1] font-bold"
                  : "text-[#76786d] hover:text-[#c6c7bb]"
              }`}
            >
              <Plus className="w-5.5 h-5.5 mb-1" />
              <span className="text-[10px] tracking-wider uppercase">Novo Cadastro</span>
            </button>

            <button
              onClick={() => {
                setCurrentView("supabase");
                checkSupabaseConnection();
              }}
              className={`flex flex-col items-center justify-center w-24 h-full text-center transition-all ${
                currentView === "supabase"
                  ? "text-[#bfcca1] font-bold"
                  : "text-[#76786d] hover:text-[#c6c7bb]"
              }`}
            >
              <Cloud className="w-5.5 h-5.5 mb-1" />
              <span className="text-[10px] tracking-wider uppercase">Nuvem</span>
            </button>
          </nav>
        )}

        {/* Custom Confirmation Modal for Exclusion */}
        <AnimatePresence>
          {propertyToDelete && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm"
            >
              <motion.div 
                initial={{ scale: 0.95, y: 15 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.95, y: 15 }}
                className="bg-[#1a1c18] border border-[#45483e] rounded-xl p-5 max-w-xs w-full space-y-4 shadow-2xl text-center"
              >
                <div className="w-12 h-12 bg-[#69000c]/20 rounded-full flex items-center justify-center mx-auto text-[#ffdad6] border border-[#69000c]/40">
                  <AlertTriangle className="w-6 h-6 text-[#ffb4ac]" />
                </div>
                
                <div className="space-y-1.5">
                  <h3 className="text-sm font-bold text-[#ffb4ac] uppercase tracking-wider">
                    Confirmar Exclusão
                  </h3>
                  <p className="text-xs text-[#c6c7bb] leading-relaxed">
                    Deseja mesmo excluir o cadastro de <strong className="text-white">&ldquo;{propertyToDelete.name}&rdquo;</strong>? Esta ação é permanente e não poderá ser desfeita.
                  </p>
                </div>

                <div className="flex gap-3 pt-1">
                  <button
                    onClick={() => setPropertyToDelete(null)}
                    className="flex-1 bg-transparent hover:bg-[#45483e]/20 border border-[#45483e] text-[#c6c7bb] text-xs font-bold py-2.5 rounded-lg transition-all"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={async () => {
                      if (propertyToDelete.id !== undefined) {
                        try {
                          if (dbSource === "supabase") {
                            const res = await fetch(`/api/properties?id=${propertyToDelete.id}`, {
                              method: "DELETE",
                            });
                            if (!res.ok) {
                              const errData = await res.json();
                              throw new Error(errData.error || "Erro ao excluir no Supabase");
                            }
                          } else {
                            await deleteProperty(propertyToDelete.id);
                          }
                          showSuccessFeedback(`Cadastro de "${propertyToDelete.name}" excluído.`);
                          setPropertyToDelete(null);
                          setSelectedPropertyId(null);
                          setCurrentView("search");
                          await refreshPropertiesList();
                        } catch (err: any) {
                          console.error(err);
                          showErrorFeedback(err.message || "Erro ao excluir o cadastro.");
                        }
                      }
                    }}
                    className="flex-1 bg-[#69000c] hover:bg-[#92030f] text-white text-xs font-bold py-2.5 rounded-lg transition-all shadow-md"
                  >
                    Excluir
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

      </div>
    </div>
  );
}
