# Hackathon2026
Desafio FUNDARES: ¿Es posible transformar conversaciones, fotos y mensajes dispersos en información estructurada y útil para medir impacto ambiental? Este reto se enfocará en automatización, extracción de datos y generación de métricas desde canales de comunicación cotidianos.

Recolector escribe en WhatsApp
        ↓
WhatsApp envía el mensaje a una URL de tu servidor (webhook)
        ↓
Tu servidor lo recibe en tiempo real
        ↓
Lo procesas con IA

🔴 Capa 4 — ¿Y si manda una foto?
Si el recolector manda una foto de una planilla o de los materiales, se usa Vision AI (GPT-4o o Claude que ven imágenes). Le mandas la foto y le preguntas lo mismo — la IA la "lee" como si fuera texto y extrae los mismos datos.

⚠️ El punto crítico
La IA no es perfecta. A veces puede:

Confundir una empresa con otra
No entender una cantidad mal escrita
No reconocer bien una foto borrosa

Por eso existe el módulo de validación de Fundares — un humano revisa antes de que los datos lleguen a las empresas. La IA hace el 90% del trabajo, Fundares corrige el 10%.
