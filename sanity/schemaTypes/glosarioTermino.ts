import {defineField, defineType} from 'sanity'

export default defineType({
  name: 'glosarioTermino',
  title: 'Glosario de Términos',
  type: 'document',
  fields: [
    defineField({
      name: 'coreano',
      title: 'Término en Coreano (Hangul)',
      description: 'Caracteres coreanos oficiales (ej. 태권도, 차렷, 지르기)',
      type: 'string',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'romanizacion',
      title: 'Romanización (Fonética)',
      description: 'Transcripción fonética internacional oficial ITF (ej. Taekwon-Do, Charyot, Jirugi)',
      type: 'string',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'espanol',
      title: 'Significado en Español',
      description: 'Traducción o definición en español (ej. Golpe de puño, Posición de caminar)',
      type: 'string',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'ingles',
      title: 'Significado en Inglés',
      description: 'Traducción oficial en inglés según manual ITF (ej. Punch, Walking stance)',
      type: 'string',
    }),
    defineField({
      name: 'categoria',
      title: 'Categoría',
      description: 'Clasificación del término técnico',
      type: 'string',
      options: {
        list: [
          {title: 'General', value: 'General'},
          {title: 'Comandos', value: 'Comandos'},
          {title: 'Posiciones', value: 'Posiciones'},
          {title: 'Técnica', value: 'Técnica'},
          {title: 'Grados', value: 'Grados'},
          {title: 'Números', value: 'Números'},
          {title: 'Zonas', value: 'Zonas'},
        ],
      },
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'audio',
      title: 'Audio personalizado de pronunciación',
      description: 'Opcional. Archivo de audio nativo (mp3/wav/ogg). Si no se proporciona, se utiliza la pronunciación automática en coreano.',
      type: 'file',
      options: {
        accept: 'audio/*',
      },
    }),
    defineField({
      name: 'orden',
      title: 'Orden de aparición',
      description: 'Opcional. Número para ordenar manualmente (menor número aparece antes)',
      type: 'number',
    }),
    defineField({
      name: 'activo',
      title: 'Término activo',
      description: 'Desmarcar para ocultar del glosario público sin eliminarlo',
      type: 'boolean',
      initialValue: true,
    }),
  ],
  preview: {
    select: {
      title: 'romanizacion',
      subtitle: 'espanol',
      coreano: 'coreano',
      categoria: 'categoria',
    },
    prepare({title, subtitle, coreano, categoria}) {
      return {
        title: `${title || ''} (${coreano || ''})`,
        subtitle: `${categoria ? `[${categoria}] ` : ''}${subtitle || ''}`,
      }
    },
  },
  orderings: [
    {
      title: 'Orden manual',
      name: 'ordenAsc',
      by: [{field: 'orden', direction: 'asc'}, {field: 'romanizacion', direction: 'asc'}],
    },
    {
      title: 'Romanización (A-Z)',
      name: 'romanizacionAsc',
      by: [{field: 'romanizacion', direction: 'asc'}],
    },
    {
      title: 'Categoría',
      name: 'categoriaAsc',
      by: [{field: 'categoria', direction: 'asc'}, {field: 'romanizacion', direction: 'asc'}],
    },
  ],
})
