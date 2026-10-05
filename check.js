const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)

async function check() {
  const { data, error } = await supabase.from('checklists').insert({
      pet_nome: "test",
      especie: "Cão",
      raca: "SRD",
      tutor: "Test",
      detalhes: { laco: true },
      tosa: { higienica: true },
      hidratacao: { padrao: true },
      observacao: "test",
      realizado_por_id: "7d6fa6d4-8df6-4f4f-b6e5-4d7df6db0706",
      vistoriado_por_id: "7d6fa6d4-8df6-4f4f-b6e5-4d7df6db0706",
      termo_aceito: true
  })
  console.log("Error:", error)
}
check()
