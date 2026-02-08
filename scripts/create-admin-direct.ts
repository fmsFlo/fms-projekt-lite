import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

async function main() {
  const email = process.argv[2] || 'admin@financemadesimple.de'
  const password = process.argv[3] || 'admin123'

  console.log(`🔄 Erstelle Admin-User: ${email}`)

  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })

    // 1. Prüfe, ob User bereits existiert
    const { data: existingUsers } = await supabase.auth.admin.listUsers()
    const existingUser = existingUsers?.users.find(u => u.email === email.toLowerCase())

    let authUserId: string

    if (existingUser) {
      console.log(`✅ Auth User existiert bereits: ${existingUser.id}`)
      authUserId = existingUser.id

      // Aktualisiere Passwort
      const { error: updateError } = await supabase.auth.admin.updateUserById(
        existingUser.id,
        { password: password }
      )

      if (updateError) {
        console.error('❌ Fehler beim Passwort-Update:', updateError.message)
      } else {
        console.log(`✅ Passwort aktualisiert`)
      }
    } else {
      // 2. Erstelle neuen Auth User
      console.log(`📝 Erstelle neuen Supabase Auth User...`)
      const { data, error } = await supabase.auth.admin.createUser({
        email: email.toLowerCase(),
        password: password,
        email_confirm: true,
      })

      if (error || !data.user) {
        console.error('❌ Supabase Auth Error:', error?.message)
        process.exit(1)
      }

      authUserId = data.user.id
      console.log(`✅ Supabase Auth User erstellt: ${authUserId}`)
    }

    // 3. Prüfe/Erstelle User in users-Tabelle
    const { data: appUser, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('auth_user_id', authUserId)
      .maybeSingle()

    if (userError && userError.code !== 'PGRST116') {
      console.error('❌ Fehler beim Abrufen des Users:', userError.message)
    }

    if (!appUser) {
      console.log(`📝 Erstelle User-Eintrag in Datenbank...`)

      const { error: insertError } = await supabase
        .from('users')
        .insert({
          auth_user_id: authUserId,
          email: email.toLowerCase(),
          role: 'admin',
          name: 'Admin',
          is_active: true,
        })

      if (insertError) {
        console.error('❌ Fehler beim Erstellen des Users:', insertError.message)
        process.exit(1)
      }

      console.log(`✅ User-Eintrag erstellt`)
    } else {
      console.log(`✅ User-Eintrag existiert bereits`)

      // Stelle sicher, dass der User aktiv ist und Admin-Rechte hat
      const { error: updateError } = await supabase
        .from('users')
        .update({
          is_active: true,
          role: 'admin',
        })
        .eq('auth_user_id', authUserId)

      if (updateError) {
        console.error('❌ Fehler beim Aktualisieren des Users:', updateError.message)
      } else {
        console.log(`✅ User-Status aktualisiert (aktiv, admin)`)
      }
    }

    console.log(`\n✅ ERFOLG!\n`)
    console.log(`Login-Daten:`)
    console.log(`Email: ${email}`)
    console.log(`Passwort: ${password}`)
    console.log(`\nSie können sich jetzt unter /login einloggen.\n`)

  } catch (error: any) {
    console.error('❌ Error:', error.message)
    console.error(error)
    process.exit(1)
  }
}

main()
