import { AideFactory } from '#tests/fixtures/aide_factory'
import { SimulateurFactory } from '#tests/fixtures/simulateur_factory'
import { TypeAideFactory } from '#tests/fixtures/type_aide_factory'
import { test } from '@japa/runner'

test.group('AideController', (group) => {
  group.each.setup(async () => {
    await AideFactory.cleanup()
    await SimulateurFactory.cleanup()
    await TypeAideFactory.cleanup()
  })

  group.each.teardown(async () => {
    await AideFactory.cleanup()
    await SimulateurFactory.cleanup()
    await TypeAideFactory.cleanup()
  })

  test('GET /aides should list published aides', async ({ client, assert }) => {
    // Create aides with different statuses
    await AideFactory.createAide({
      slug: 'published-aide',
      title: 'Published Aide',
      status: 'published',
      typeAideSlug: 'aide-financiere',
      usage: 'loyer-logement',
      instructeur: 'CAF',
    })
    await AideFactory.createAide({
      slug: 'draft-aide',
      title: 'Draft Aide',
      status: 'draft',
      typeAideSlug: 'aide-financiere',
      usage: 'loyer-logement',
    })
    await AideFactory.createAide({
      slug: 'unlisted-aide',
      title: 'Unlisted Aide',
      status: 'unlisted',
      typeAideSlug: 'aide-financiere',
      usage: 'loyer-logement',
    })

    const response = await client.get('/aides').withInertia()

    response.assertStatus(200)
    response.assertInertiaComponent('content/aides/aides')

    const props = response.inertiaProps as { aides: any[] }
    assert.property(props, 'aides')
    assert.equal(props.aides.length, 1)
    assert.equal(props.aides[0].slug, 'published-aide')
    assert.equal(props.aides[0].title, 'Published Aide')
    assert.equal(props.aides[0].typeAide.slug, 'aide-financiere')
    assert.equal(props.aides[0].usage, 'loyer-logement')
    assert.equal(props.aides[0].instructeur, 'CAF')
  })

  test('GET /aides/:aide_slug should show a published aide', async ({ client, assert }) => {
    const aide = await AideFactory.createAide({
      slug: 'test-aide',
      title: 'Test Aide',
      status: 'published',
      content: '# Test Aide Content\n\nThis is a test aide.',
      typeAideSlug: 'aide-financiere',
      usage: 'loyer-logement',
    })

    const response = await client.get(`/aides/${aide.slug}`).withInertia()

    response.assertStatus(200)
    response.assertInertiaComponent('content/aides/aide')

    const props = response.inertiaProps as { aide: any, html: string }
    assert.property(props, 'aide')
    assert.property(props, 'html')
    assert.equal(props.aide.slug, 'test-aide')
    assert.equal(props.aide.title, 'Test Aide')
    assert.include(props.html, '<h1>Test Aide Content</h1>')
    assert.include(props.html, '<p>This is a test aide.</p>')
  })

  test('GET /aides/:aide_slug should show an unlisted aide', async ({ client, assert }) => {
    const aide = await AideFactory.createAide({
      slug: 'unlisted-aide',
      title: 'Unlisted Aide',
      status: 'unlisted',
      content: '# Unlisted Aide Content',
      typeAideSlug: 'aide-financiere',
      usage: 'loyer-logement',
    })

    const response = await client.get(`/aides/${aide.slug}`).withInertia()

    response.assertStatus(200)
    response.assertInertiaComponent('content/aides/aide')

    const props = response.inertiaProps as { aide: any, html: string }
    assert.property(props, 'aide')
    assert.property(props, 'html')
    assert.equal(props.aide.slug, 'unlisted-aide')
    assert.equal(props.aide.title, 'Unlisted Aide')
    assert.include(props.html, '<h1>Unlisted Aide Content</h1>')
  })

  test('GET /aides/:aide_slug should return 404 for draft aide', async ({ client }) => {
    const aide = await AideFactory.createAide({
      slug: 'draft-aide',
      title: 'Draft Aide',
      status: 'draft',
      content: '# Draft Content',
      typeAideSlug: 'aide-financiere',
      usage: 'loyer-logement',
    })

    const response = await client
      .get(`/aides/${aide.slug}`)
      .withInertia()

    response.assertStatus(404)
    // response.assertBodyContains('Aide non trouvée')
  })

  test('GET /aides/:aide_slug should return 404 for non-existent aide', async ({ client }) => {
    const response = await client.get('/aides/non-existent-aide')

    response.assertStatus(404)
    // response.assertBodyContains('Aide non trouvée')
  })

  test('GET /simulateurs/:simulateur_slug/resultats/:hash/aides/:aide_slug should show aide with results context', async ({ client, assert }) => {
    const simulateur = await SimulateurFactory.createSimulateur({
      slug: 'test-simulateur',
      title: 'Test Simulateur',
      status: 'published',
    })

    const aide = await AideFactory.createAide({
      slug: 'contextualized-aide',
      title: 'Contextualized Aide',
      status: 'published',
      content: '# Aide with Results Context\n\nThis aide is shown with results context.',
      typeAideSlug: 'aide-financiere',
      usage: 'loyer-logement',
    })

    const response = await client
      .get(`/simulateurs/${simulateur.slug}/resultats/test-hash/aides/${aide.slug}`)
      .withInertia()

    response.assertStatus(200)
    response.assertInertiaComponent('content/aides/resultats-aide')

    const props = response.inertiaProps as { aide: any, simulateur: any, hash: string, html: string }
    assert.property(props, 'aide')
    assert.property(props, 'simulateur')
    assert.property(props, 'hash')
    assert.property(props, 'html')

    assert.equal(props.aide.slug, 'contextualized-aide')
    assert.equal(props.aide.title, 'Contextualized Aide')
    assert.equal(props.simulateur.slug, 'test-simulateur')
    assert.equal(props.simulateur.title, 'Test Simulateur')
    assert.equal(props.hash, 'test-hash')
    assert.include(props.html, '<h1>Aide with Results Context</h1>')
  })

  test('GET /simulateurs/:simulateur_slug/resultats/:hash/aides/:aide_slug should return 404 when aide not found', async ({ client }) => {
    const simulateur = await SimulateurFactory.createSimulateur({
      slug: 'test-simulateur',
      title: 'Test Simulateur',
      status: 'published',
    })

    const response = await client.get(`/simulateurs/${simulateur.slug}/resultats/test-hash/aides/non-existent-aide`)

    response.assertStatus(404)
    // response.assertBodyContains('Aide non trouvée')
  })

  test('GET /simulateurs/:simulateur_slug/resultats/:hash/aides/:aide_slug should return 404 when simulateur not found', async ({ client }) => {
    const aide = await AideFactory.createAide({
      slug: 'test-aide',
      title: 'Test Aide',
      status: 'published',
      typeAideSlug: 'aide-financiere',
      usage: 'loyer-logement',
    })

    const response = await client.get(`/simulateurs/non-existent-simulateur/resultats/test-hash/aides/${aide.slug}`)

    response.assertStatus(404)
    // response.assertBodyContains('Simulateur non trouvé')
  })

  test('GET /simulateurs/:simulateur_slug/resultats/:hash/aides/:aide_slug should handle unlisted simulateur and aide', async ({ client, assert }) => {
    const simulateur = await SimulateurFactory.createSimulateur({
      slug: 'unlisted-simulateur',
      title: 'Unlisted Simulateur',
      status: 'unlisted',
    })

    const aide = await AideFactory.createAide({
      slug: 'unlisted-aide',
      title: 'Unlisted Aide',
      status: 'unlisted',
      content: '# Unlisted Results Context Test',
      typeAideSlug: 'aide-financiere',
      usage: 'loyer-logement',
    })

    const response = await client
      .get(`/simulateurs/${simulateur.slug}/resultats/test-hash/aides/${aide.slug}`)
      .withInertia()

    response.assertStatus(200)
    response.assertInertiaComponent('content/aides/resultats-aide')

    const props = response.inertiaProps as { aide: any, simulateur: any, hash: string, html: string }
    assert.equal(props.aide.slug, 'unlisted-aide')
    assert.equal(props.simulateur.slug, 'unlisted-simulateur')
    assert.equal(props.hash, 'test-hash')
    assert.include(props.html, '<h1>Unlisted Results Context Test</h1>')
  })

  test('Aide DTOs should serialize correctly', async ({ client, assert }) => {
    const aide = await AideFactory.createAide({
      slug: 'dto-test',
      title: 'DTO Test Aide',
      status: 'published',
      description: 'Test description',
      metaDescription: 'Test meta description',
      content: '# DTO Test',
      typeAideSlug: 'aide-financiere',
      usage: 'loyer-logement',
      instructeur: 'Prefecture',
    })

    const response = await client.get(`/aides/${aide.slug}`).withInertia()

    response.assertStatus(200)

    const props = response.inertiaProps as { aide: any }
    const aideData = props.aide

    // SingleDto properties
    assert.property(aideData, 'id')
    assert.property(aideData, 'updatedAt')
    assert.property(aideData, 'title')
    assert.property(aideData, 'slug')
    assert.property(aideData, 'description')
    assert.property(aideData, 'metaDescription')

    assert.equal(aideData.title, 'DTO Test Aide')
    assert.equal(aideData.slug, 'dto-test')
    assert.equal(aideData.description, 'Test description')
    assert.equal(aideData.metaDescription, 'Test meta description')
    assert.isNumber(aideData.id)
    assert.isNotNull(aideData.updatedAt)
  })

  test('AideController ListDto should serialize correctly for index page', async ({ client, assert }) => {
    await AideFactory.createAide({
      slug: 'list-test-1',
      title: 'List Test Aide 1',
      status: 'published',
      description: 'First test description',
      typeAideSlug: 'aide-financiere',
      usage: 'loyer-logement',
      instructeur: 'DIRECCTE',
    })
    await AideFactory.createAide({
      slug: 'list-test-2',
      title: 'List Test Aide 2',
      status: 'published',
      description: 'Second test description',
      typeAideSlug: 'aide-financiere',
      usage: 'loyer-logement',
      instructeur: 'CCI',
    })

    const response = await client.get('/aides').withInertia()

    response.assertStatus(200)

    const props = response.inertiaProps as { aides: any[] }
    assert.equal(props.aides.length, 2)

    // Check ListDto properties for each aide
    props.aides.forEach((aide, index) => {
      assert.property(aide, 'title')
      assert.property(aide, 'slug')
      assert.property(aide, 'description')
      assert.property(aide, 'instructeur')
      assert.property(aide, 'typeAide')
      assert.property(aide, 'usage')

      // Check that SingleDto properties are NOT included in ListDto
      assert.notProperty(aide, 'id')
      assert.notProperty(aide, 'updatedAt')
      assert.notProperty(aide, 'metaDescription')

      if (index === 0) {
        assert.equal(aide.title, 'List Test Aide 1')
        assert.equal(aide.slug, 'list-test-1')
        assert.equal(aide.description, 'First test description')
        assert.equal(aide.typeAide.slug, 'aide-financiere')
        assert.equal(aide.usage, 'loyer-logement')
        assert.equal(aide.instructeur, 'DIRECCTE')
      }
    })
  })

  test('GET /aides should handle complex aide data with textesLoi', async ({ client, assert }) => {
    const textesLoi = [
      {
        label: 'Article L123-1',
        url: 'https://example.com/loi1',
      },
      {
        label: 'Décret n°2024-001',
        url: 'https://example.com/decret1',
      },
    ]

    await AideFactory.createAide({
      slug: 'aide-with-textes-loi',
      title: 'Aide avec Textes de Loi',
      status: 'published',
      typeAideSlug: 'aide-financiere',
      usage: 'loyer-logement',
      textesLoi,
    })

    const response = await client.get('/aides').withInertia()

    response.assertStatus(200)

    const props = response.inertiaProps as { aides: any[] }
    assert.equal(props.aides.length, 1)

    const aide = props.aides[0]
    assert.equal(aide.title, 'Aide avec Textes de Loi')
    assert.equal(aide.slug, 'aide-with-textes-loi')

    // Note: textesLoi is not included in ListDto, only in the database
    assert.notProperty(aide, 'textesLoi')
  })

  test('GET /aides/:aide_slug should properly render markdown content with complex formatting', async ({ client, assert }) => {
    const aide = await AideFactory.createAide({
      slug: 'markdown-test',
      title: 'Markdown Test Aide',
      status: 'published',
      typeAideSlug: 'aide-financiere',
      usage: 'loyer-logement',
      content: `# Aide Principale

## Conditions d'éligibilité

Cette aide est destinée aux **entreprises** qui remplissent les conditions suivantes :

- Avoir moins de 250 salariés
- Réaliser un chiffre d'affaires *inférieur* à 50M€
- Être immatriculée depuis plus de 2 ans

### Montant de l'aide

Le montant peut atteindre **jusqu'à 50 000€** selon les critères.

> **Important :** Cette aide n'est pas cumulable avec d'autres dispositifs.

Pour plus d'informations : [Site officiel](https://example.gov.fr)

\`\`\`
Calcul du montant :
Montant = (CA × 0.1) + forfait_base
\`\`\``,
    })

    const response = await client.get(`/aides/${aide.slug}`).withInertia()

    response.assertStatus(200)

    const props = response.inertiaProps as { aide: any, html: string }

    // Verify markdown rendering
    assert.include(props.html, '<h1>Aide Principale</h1>')
    assert.include(props.html, '<h2>Conditions d&#39;éligibilité</h2>')
    assert.include(props.html, '<h3>Montant de l&#39;aide</h3>')
    assert.include(props.html, '<strong>entreprises</strong>')
    assert.include(props.html, '<em>inférieur</em>')
    assert.include(props.html, '<ul>')
    assert.include(props.html, '<li>Avoir moins de 250 salariés</li>')
    assert.include(props.html, '<blockquote>')
    assert.include(props.html, '<strong>Important :</strong>')
    assert.include(props.html, '<a href="https://example.gov.fr">Site officiel</a>')
    assert.include(props.html, '<pre><code>')
    assert.include(props.html, 'Calcul du montant :')
  })
})
