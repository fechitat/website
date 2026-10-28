import {defineField} from 'sanity'

// Campos editoriales compartidos por artículos, documentos y fichas del catálogo.
export const catalogoFields = [
  defineField({
    name: 'tematicas', title: 'Temáticas del catálogo', type: 'array', of: [{type: 'string'}],
    options: {list: [
      {title: 'Formas', value: 'formas'}, {title: 'Teoría', value: 'teoria'},
      {title: 'Técnica', value: 'tecnica'}, {title: 'Competencias', value: 'competencias'},
      {title: 'Reglamentos', value: 'reglamentos'}, {title: 'Institucional', value: 'institucional'},
    ]},
    validation: (Rule) => Rule.unique(),
  }),
  defineField({name: 'palabrasClave', title: 'Etiquetas de búsqueda', type: 'array', of: [{type: 'string'}], options: {layout: 'tags'}}),
  defineField({
    name: 'prioridad', title: 'Prioridad editorial', type: 'number', initialValue: 0,
    description: 'Los valores mayores aparecen primero en Recomendados. Cero significa sin prioridad manual.',
    validation: (Rule) => Rule.integer().min(0),
  }),
  defineField({name: 'fundamental', title: 'Recurso fundamental para el estudio o la práctica', type: 'boolean', initialValue: false}),
  defineField({
    name: 'destacadoCatalogo', title: 'Destacar en Recursos', type: 'boolean', initialValue: false,
    description: 'Independiente de la portada y de tener imagen. Se muestran como máximo dos destacados, uno en móvil.',
  }),
  defineField({name: 'fechaActualizacion', title: 'Fecha de actualización del contenido', type: 'datetime', description: 'Opcional. Si se omite se usa la última modificación de la ficha.'}),
  defineField({
    name: 'icono', title: 'Icono del recurso', type: 'string',
    description: 'Si se omite, se utiliza el icono del tipo de recurso.',
    options: {list: [
      {title: 'Libro', value: 'book-open'}, {title: 'Herramienta', value: 'wrench'},
      {title: 'Artículo', value: 'newspaper'}, {title: 'Documento', value: 'file-text'},
    ]},
  }),
]
