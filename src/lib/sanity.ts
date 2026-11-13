import {createClient} from '@sanity/client'
import imageUrlBuilder from '@sanity/image-url'

/** Cliente de Sanity configurado para el proyecto Fechitat */
export const sanity = createClient({
  projectId: 'wyg7m2t0',
  dataset: 'production',
  apiVersion: '2024-01-01',
  useCdn: process.env.SANITY_USE_CDN === 'false' ? false : true,
})

/** Builder para generar URLs de imágenes de Sanity */
const builder = imageUrlBuilder(sanity)

/**
 * Genera la URL de una imagen de Sanity con opciones de transformación
 * @param source - Referencia de imagen de Sanity
 * @returns Builder de imagen con métodos de transformación
 */
export function urlFor(source: any) {
  return builder.image(source)
}
