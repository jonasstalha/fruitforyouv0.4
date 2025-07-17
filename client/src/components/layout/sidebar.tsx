import { Link, useLocation } from "wouter";
import { useState } from "react";
import {
  Home,
  PlusSquare,
  QrCode,
  FileText,
  ChartBar,
  Calculator,
  Layers,
  History,
  Tractor,
  Users,
  PackageCheck,
  Leaf,
  FileBarChart,
  BarChart3,
  Warehouse,
  ChevronDown,
  ChevronRight,
  Truck,
  Package,
  ClipboardList,
  UserCog,
  Calendar,
  LayoutTemplate,
  ArchiveRestore,
  ShieldCheck,
  ChevronLeft,
  Construction ,
  Plus,
  Lock,

} from "lucide-react";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/use-auth";

export default function Sidebar() {
  const [location] = useLocation();
  const [expandedSections, setExpandedSections] = useState<string[]>([]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const { user, hasAccess } = useAuth();

  const isActive = (path: string) => {
    return location === path;
  };

  const toggleSection = (section: string) => {
    setExpandedSections((prev) =>
      prev.includes(section)
        ? prev.filter((s) => s !== section)
        : [...prev, section]
    );
  };

  const toggleSidebar = () => {
    setIsSidebarOpen((prev) => !prev);
  };

  const renderSection = (title: string, items: any[], sectionKey: string) => {
    const hasAccessToSection = hasAccess(sectionKey);
    
    return (
      <div>
        <div
          className={cn(
            "mt-6 py-2 px-4 text-xs uppercase flex items-center cursor-pointer rounded-md transition-all duration-300 ease-in-out",
            hasAccessToSection 
              ? "text-neutral-500 hover:bg-neutral-700" 
              : "text-neutral-600 cursor-not-allowed opacity-50"
          )}
          onClick={hasAccessToSection ? () => toggleSection(sectionKey) : undefined}
        >
          {hasAccessToSection ? (
            expandedSections.includes(sectionKey) ? (
              <ChevronDown className="h-4 w-4 mr-2" />
            ) : (
              <ChevronRight className="h-4 w-4 mr-2" />
            )
          ) : (
            <Lock className="h-4 w-4 mr-2" />
          )}
          {isSidebarOpen && <span>{title}</span>}
        </div>
        {hasAccessToSection && expandedSections.includes(sectionKey) && (
          <ul>
            {items.map((item, index) => (
              <li key={index} className="mb-1">
                {item.isExternal ? (
                  <a href={item.path} target="_blank" rel="noopener noreferrer">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div
                          className={cn(
                            "flex items-center p-3 rounded-md transition-colors cursor-pointer",
                            "hover:bg-neutral-700 text-neutral-300"
                          )}
                        >
                          {item.icon}
                          {isSidebarOpen && <span className="ml-2">{item.title}</span>}
                        </div>
                      </TooltipTrigger>
                      {!isSidebarOpen && (
                        <TooltipContent>{item.title}</TooltipContent>
                      )}
                    </Tooltip>
                  </a>
                ) : (
                  <Link href={item.path}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div
                          className={cn(
                            "flex items-center p-3 rounded-md transition-colors cursor-pointer",
                            isActive(item.path)
                              ? "bg-green-700 text-white shadow-md"
                              : "hover:bg-neutral-700 text-neutral-300"
                          )}
                        >
                          {item.icon}
                          {isSidebarOpen && <span className="ml-2">{item.title}</span>}
                        </div>
                      </TooltipTrigger>
                      {!isSidebarOpen && (
                        <TooltipContent>{item.title}</TooltipContent>
                      )}
                    </Tooltip>
                  </Link>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    );
  };

  // All menu items with icons
  const menuItems = [
    {
      title: "Tableau de Bord",
      icon: <Home className="h-5 w-5 mr-2" />,
      path: "/",
    },
        {
      title: "general communication dashboard",
      icon: <Home className="h-5 w-5 mr-2" />,
      path: "/communication-dashboard",
    },
    {
      title: "Nouvelle Entrée",
      icon: <PlusSquare className="h-5 w-5 mr-2" />,
      path: "/new-entry",
    },
    ,
    {
      title: "commande clinet",
      icon: <PlusSquare className="h-5 w-5 mr-2" />,
      path: "/commandeclinet",
    },
    {
      title: "Scanner Code",
      icon: <QrCode className="h-5 w-5 mr-2" />,
      path: "/scan",
    },
  ];

  // const traceabilityItems = [
  //   {
  //     title: "Rapports PDF",
  //     icon: <FileText className="h-5 w-5 mr-2" />,
  //     path: "/reports",
  //   },
  //   // {
  //   //   title: "Statistiques",
  //   //   icon: <BarChart3 className="h-5 w-5 mr-2" />,
  //   //   path: "/statistics",
  //   // },
  // ];

  const adminItems = [
    {
      title: "Utilisateurs",
      icon: <Users className="h-5 w-5 mr-2" />,
      path: "/users",
    },
    {
      title: "Entrepôts",
      icon: <Warehouse className="h-5 w-5 mr-2" />,
      path: "/warehouses",
    },
    {
      title: "Gestion Lots",
      icon: <PackageCheck className="h-5 w-5 mr-2" />,
      path: "/lots",
    },
    {
      title: "Gérer Fermes",
      icon: <Tractor className="h-5 w-5 mr-2" />,
      path: "/farms",
    },
    ,
    {
      title: "gerer les commandes clinet",
      icon: <PlusSquare className="h-5 w-5 mr-2" />,
      path: "/gererlescommandesclinet",
    },
  ];

  const logisticsItems = [
    {
      title: "rapport generating",
      icon: <Truck className="h-5 w-5 mr-2" />,
      path: "/rapport-generating",
    },
    // {
    //   title: "factures-templates ",
    //   icon: <Package className="h-5 w-5 mr-2" />,
    //   path: "/factures-templates",
    // },
    {
      title: "Inventaire",
      icon: <ClipboardList className="h-5 w-5 mr-2" />,
      path: "/inventory",
    }, 
     {
      title: "Fiche d Expidition",
      icon: <ClipboardList className="h-5 w-5 mr-2" />,
      path: "/logistique/fichedexpidition",
    },
    {
      title: "Archifage",
      icon: <ClipboardList className="h-5 w-5 mr-2" />,
      path: "https://archifage.fruitsforyou.ma",
      isExternal: true,
    },
  ];

  const quality = [
    {
      title: "Contrôle Qualité",
      icon: <ShieldCheck className="h-5 w-5 mr-2" />,
      path: "/qualitycontrol",
    },
    ,
        {
      title: "Rapport qualité",
      icon: <FileBarChart className="h-5 w-5 mr-2" />,
      path: "/Rapportqualité",
    },
        {
      title: "Archivage des controles",
      icon: <ArchiveRestore className="h-5 w-5 mr-2" />,
      path: "/Archivagedescontroles",
    },

  ];
  const ReceptionItems = [
    {
      title: "Réception",
      icon: <ClipboardList className="h-5 w-5 mr-2" />,
      path: "/reception",
    },
        {
      title: "new entry ",
      icon: <ClipboardList className="h-5 w-5 mr-2" />,
      path: "/new",
    },
  ];
  const personnelItems = [
    {
      title: "Gestion Personnel",
      icon: <UserCog className="h-5 w-5 mr-2" />,
      path: "/personnelmanagement",
    },
    {
      title: "Horaires",
      icon: <Calendar className="h-5 w-5 mr-2" />,
      path: "/schedules",
    },
  ];
  const production = [
    {
      title: "calcule de consomation ",
      icon: <Calculator className="h-5 w-5 mr-2" />,
      path: "/calculedeconsomation",
    },
    {
      title: "invtory tracking ",
      icon: <History className="h-5 w-5 mr-2" />,
      path: "/historiquedeconsomation",
    },
        {
      title: "suivi de production",
      icon: <History className="h-5 w-5 mr-2" />,
      path: "/suivi-production",
    },
  ];
   const Comptabilité = [
    {
      title: "Templates",
      icon: <LayoutTemplate className="h-5 w-5 mr-2" />,
      path: "/Templates",
    },
    {
      title: "Archivage des facture  ",
      icon: <ArchiveRestore className="h-5 w-5 mr-2" />,
      path: "https://archifage.fruitsforyou.ma",
      isExternal: true,
    },

  ];
       const mantenance = [
    {
      title: "dossiere de maintenance",
      icon: <Construction  className="h-5 w-5 mr-2" />,
      path: "/dossieredemaintenance",
    },
     {
      title: "historique de maintenance",
      icon: <History className="h-5 w-5 mr-2" />,
      path: "/historiquedemaintenance",
    },
    ,
     {
      title: "analyse vibratoire",
      icon: <Plus  className="h-5 w-5 mr-2" />,
      path: "/automatisationdemaintenance",
    },
         {
      title: "pieces de rechange maintenance",
      icon: <Plus  className="h-5 w-5 mr-2" />,
      path: "/piecesderechangemaintenance",
    },


  ];

  return (
    <TooltipProvider>
      <aside
        className={cn(
          "bg-neutral-800 text-white flex-shrink-0 h-screen flex flex-col transition-all duration-300 ease-in-out shadow-lg",
          isSidebarOpen ? "w-64" : "w-16"
        )}
      >
        {/* Sidebar Header */}
        <div className="p-4 border-b border-neutral-700 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Leaf className="h-6 w-6 text-green-400" />
            {isSidebarOpen && <h1 className="font-bold text-xl">Fruits For You</h1>}
          </div>
          <button
            onClick={toggleSidebar}
            className="text-neutral-400 hover:text-white focus:outline-none"
          >
            {isSidebarOpen ? <ChevronLeft className="h-5 w-5" /> : <ChevronRight className="h-5 w-5" />}
          </button>
        </div>

        {/* User Info */}
        {user && isSidebarOpen && (
          <div className="p-4 bg-neutral-900 border-b border-neutral-700">
            <div className="text-sm text-green-400 font-medium">{user.email}</div>
            <div className="text-xs text-neutral-500 capitalize">
              Rôle: {user.role === 'comptabilite' ? 'Comptabilité' : user.role === 'maintenance' ? 'Maintenance' : user.role}
            </div>
          </div>
        )}

        {/* Navigation */}
        <nav className="p-2 flex-grow overflow-y-auto">
          {renderSection("Menu Principal", menuItems, "menu")}
          {/* {renderSection("Traçabilité", traceabilityItems, "traceability")} */}
          {renderSection("Administration", adminItems, "admin")}
          {renderSection("Logistique", logisticsItems, "logistics")}
          {renderSection("Qualité", quality, "quality")}
          {renderSection("Réception", ReceptionItems, "reception")}
          {renderSection("Production", production, "production")}
          {renderSection("Personnel", personnelItems, "personnel")}
          {renderSection("Comptabilité", Comptabilité, "Comptabilité")}
          {renderSection("Maintenance", mantenance, "maintenance")}          
        </nav>

        {/* Bottom Section with Version and Info */}
        {isSidebarOpen && (
          <div className="p-2 border-t border-neutral-700 text-center text-xs text-neutral-500">
            <div>Version 0.1</div>
            <div>© 2025 Convo Bio Compliance</div>
          </div>
        )}
      </aside>
    </TooltipProvider>
  );
}
