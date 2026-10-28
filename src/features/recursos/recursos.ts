import { getResourceCategory, type CatalogResource } from './catalogo.ts';

// Estos destinos ya existían en Recursos y mantienen sus funcionalidades independientes.
export const LOCAL_RESOURCES: CatalogResource[] = [
  {
    id: 'programa-examen',
    isFundamental: true,
    title: 'Programa de examen',
    description: 'Consulta el programa de examen para preparar tu estudio y entrenamiento.',
    href: '/recursos/formacion/programa-examen',
    category: getResourceCategory('teoria'),
    format: 'guia',
    keywords: ['grados', 'cinturones', 'requisitos', 'estudio'],
  },
  {
    id: 'terminologia',
    isFundamental: true,
    title: 'Terminología',
    description: 'Repasa el vocabulario del Taekwon-Do ITF en español, inglés y coreano.',
    href: '/recursos/formacion/terminologia',
    category: getResourceCategory('teoria'),
    format: 'guia',
    keywords: ['diccionario', 'vocabulario', 'idiomas', 'estudio'],
  },
  {
    id: 'sonkal-itf',
    isFundamental: true,
    title: 'TUL · Sonkal ITF',
    description: 'Estudia las formas del Taekwon-Do ITF con la aplicación Sonkal ITF.',
    href: 'https://play.google.com/store/apps/details?id=cz.principal.tul.tkd.itf&hl=en-US',
    category: getResourceCategory('formas'),
    format: 'herramienta',
    keywords: ['patrones', 'tul', 'aplicación', 'Android'],
  },
  {
    id: 'temporizador-formas',
    isFundamental: true,
    title: 'Temporizador de formas',
    description: 'Organiza tu práctica de formas con un temporizador configurable.',
    href: 'https://tools-sigma-olive.vercel.app/temporizador',
    category: getResourceCategory('formas'),
    format: 'herramienta',
    keywords: ['tiempo', 'entrenamiento', 'tul'],
  },
];
