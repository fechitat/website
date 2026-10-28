import {defineField, defineType} from 'sanity'
import {catalogoFields} from './catalogoFields'

export default defineType({
  name: 'blogPost',
  title: 'Blog Post',
  type: 'document',
  fields: [
    defineField({
      name: 'titulo',
      title: 'Título',
      type: 'string',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'slug',
      title: 'Slug',
      type: 'slug',
      options: {source: 'titulo'},
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'fecha',
      title: 'Fecha de publicación',
      type: 'datetime',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'autor',
      title: 'Autor',
      type: 'string',
    }),
    defineField({
      name: 'imagen',
      title: 'Imagen principal',
      type: 'image',
      options: {hotspot: true},
      fields: [{name: 'alt', title: 'Texto alternativo', type: 'string'}],
    }),
    defineField({
      name: 'extracto',
      title: 'Extracto',
      type: 'text',
      validation: (Rule) => Rule.max(200),
    }),
    defineField({
      name: 'contenido',
      title: 'Contenido',
      type: 'array',
      of: [
        {type: 'block'},
        {
          type: 'image',
          options: {hotspot: true},
        },
      ],
    }),
    defineField({
      name: 'categorias',
      title: 'Categoría',
      description: 'Selecciona una sola categoría temática para el recurso.',
      type: 'array',
      of: [{type: 'string'}],
      validation: (Rule) => Rule.required().min(1).max(1).error('Selecciona una sola categoría.'),
      options: {
        list: [
          {title: 'Noticias', value: 'noticias'},
          {title: 'Teoría', value: 'teoria'},
          {title: 'Técnica', value: 'tecnica'},
          {title: 'Formas', value: 'formas'},
          {title: 'Arbitraje', value: 'arbitraje'},
          {title: 'Entrevistas', value: 'entrevistas'},
          {title: 'Historia', value: 'historia'},
        ],
      },
    }),
    defineField({
      name: 'destacado',
      title: 'Post destacado',
      type: 'boolean',
      initialValue: false,
    }),
    ...catalogoFields,
  ],
  preview: {
    select: {
      title: 'titulo',
      subtitle: 'fecha',
      media: 'imagen',
    },
    prepare({title, subtitle, media}) {
      return {
        title,
        subtitle: subtitle ? new Date(subtitle).toLocaleDateString('es-CL') : '',
        media,
      }
    },
  },
})
