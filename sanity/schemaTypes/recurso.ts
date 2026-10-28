import {defineField, defineType} from 'sanity'
import {catalogoFields} from './catalogoFields'

export default defineType({
  name: 'recurso', title: 'Recurso del catálogo', type: 'document',
  fields: [
    defineField({name: 'titulo', title: 'Título', type: 'string', validation: (Rule) => Rule.required()}),
    defineField({
      name: 'slug', title: 'Identificador único', type: 'slug', options: {source: 'titulo'},
      description: 'Para administrar un recurso inicial, utiliza programa-examen, terminologia, sonkal-itf o temporizador-formas.',
      validation: (Rule) => Rule.required(),
    }),
    defineField({name: 'descripcion', title: 'Descripción', type: 'text', rows: 3, validation: (Rule) => Rule.max(500)}),
    defineField({
      name: 'tipo', title: 'Tipo principal', type: 'string',
      options: {list: [
        {title: 'Herramienta', value: 'herramienta'}, {title: 'Guía', value: 'guia'},
        {title: 'Documento', value: 'documento'}, {title: 'Artículo', value: 'articulo'},
      ]}, validation: (Rule) => Rule.required(),
    }),
    defineField({name: 'categoria', title: 'Categoría principal', type: 'string', description: 'Etiqueta editorial visible en la tarjeta.'}),
    defineField({name: 'destino', title: 'Enlace del recurso', type: 'url', validation: (Rule) => Rule.required().uri({allowRelative: true, scheme: ['http', 'https']})}),
    defineField({name: 'accion', title: 'Texto de acción', type: 'string', description: 'Opcional. Se utiliza la acción del tipo si se omite.'}),
    defineField({
      name: 'imagen', title: 'Miniatura informativa (opcional)', type: 'image', options: {hotspot: true},
      fields: [{name: 'alt', title: 'Texto alternativo', type: 'string', validation: (Rule) => Rule.required()}],
    }),
    defineField({name: 'fechaPublicacion', title: 'Fecha de publicación', type: 'datetime'}),
    defineField({name: 'autor', title: 'Autor', type: 'string'}),
    defineField({name: 'version', title: 'Versión o edición', type: 'string', hidden: ({document}) => document?.tipo !== 'documento'}),
    defineField({
      name: 'estado', title: 'Vigencia verificada', type: 'string', hidden: ({document}) => document?.tipo !== 'documento',
      description: 'No seleccionar Vigente sin confirmar el estado del documento.',
      options: {list: ['vigente', 'archivado', 'reemplazado', 'obsoleto']},
    }),
    ...catalogoFields,
    defineField({name: 'activo', title: 'Publicado en el catálogo', type: 'boolean', initialValue: true}),
  ],
  preview: {select: {title: 'titulo', subtitle: 'tipo', media: 'imagen'}},
})
