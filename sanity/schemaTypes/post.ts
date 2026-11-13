import {DocumentTextIcon} from '@sanity/icons/DocumentText'
import {defineArrayMember, defineField, defineType} from 'sanity'
import {catalogoFields} from './catalogoFields'

export default defineType({
  name: 'post',
  title: 'Noticia / Artículo',
  icon: DocumentTextIcon,
  type: 'document',
  fields: [
    defineField({
      name: 'title',
      title: 'Título del artículo o noticia',
      type: 'string',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'slug',
      title: 'Slug',
      type: 'slug',
      options: {source: 'title'},
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'excerpt',
      title: 'Extracto / Bajada',
      description: 'Breve resumen para tarjetas de noticias y descripción SEO.',
      type: 'text',
      rows: 3,
      validation: (Rule) => Rule.required().max(300),
    }),
    defineField({
      name: 'content',
      title: 'Contenido completo',
      type: 'array',
      of: [
        defineArrayMember({type: 'block'}),
        defineArrayMember({type: 'image', options: {hotspot: true}}),
      ],
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'coverImage',
      title: 'Imagen de portada',
      type: 'image',
      options: {hotspot: true},
    }),
    defineField({
      name: 'author',
      title: 'Autor de la nota',
      description: 'Persona redactora. Si queda vacío, se muestra institucionalmente como "FECHITAT".',
      type: 'reference',
      to: [{type: 'person'}],
    }),
    defineField({
      name: 'publishedAt',
      title: 'Fecha y hora de publicación',
      type: 'datetime',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'categories',
      title: 'Categorías',
      type: 'array',
      of: [{type: 'string'}],
      options: {
        list: [
          {title: 'Técnica', value: 'Técnica'},
          {title: 'Noticias', value: 'Noticias'},
        ],
      },
      validation: (Rule) => Rule.required().min(1),
      initialValue: ['Noticias'],
    }),
    defineField({
      name: 'relatedEvent',
      title: 'Evento relacionado (opcional)',
      description: 'Vincular a un evento oficial si el artículo reporta resultados o convocatoria.',
      type: 'reference',
      to: [{type: 'event'}],
    }),
    defineField({
      name: 'featured',
      title: 'Destacar en portada',
      type: 'boolean',
      initialValue: false,
    }),
    ...catalogoFields,
  ],
  preview: {
    select: {
      title: 'title',
      publishedAt: 'publishedAt',
      authorName: 'author.name',
      media: 'coverImage',
    },
    prepare({title, publishedAt, authorName, media}) {
      const dateStr = publishedAt ? new Date(publishedAt).toLocaleDateString('es-CL') : 'Sin fecha'
      const author = authorName ? `Por ${authorName}` : 'FECHITAT'
      return {
        title,
        subtitle: `${dateStr} · ${author}`,
        media,
      }
    },
  },
  orderings: [
    {
      title: 'Más recientes',
      name: 'publishedAtDesc',
      by: [{field: 'publishedAt', direction: 'desc'}],
    },
  ],
})
