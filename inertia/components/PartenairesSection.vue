<script lang="ts" setup>
const partenaires = [
  [
    {
      url: 'https://www.service-public.fr/',
      src: '/logos/logo-service-public.png',
      alt: 'Service-Public.fr',
    },
    {
      url: 'https://monlogementetudiant.beta.gouv.fr/',
      src: '/logos/logo-mon-logement-etudiant.png',
      alt: 'Mon Logement Étudiant',
    },
  ],
  [
    {
      url: 'https://etuloge.fr/',
      src: '/logos/logo-etuloge.png',
      alt: 'Etuloge',
    },
    {
      url: 'https://www.lokaviz.fr/',
      src: '/logos/logo-lokaviz.png',
      alt: 'Lokaviz',
    },
    {
      url: 'https://www.immojeune.com/',
      src: '/logos/logo-imojeune.png',
      alt: 'Imojeune',
    },
  ],
]
</script>

<template>
  <h2
    :style="{ textAlign: 'center' }"
    class="fr-title"
  >
    Nos partenaires
  </h2>
  <div
    v-for="row, i in partenaires"
    :key="i"
    class="fr-grid-row fr-grid-row--gutters fr-grid-row--middle fr-mt-4w"
  >
    <a
      v-for="parenaire, j in row"
      :key="j"
      :href="parenaire.url"
      target="_blank"
      rel="noopener noreferrer"
      :class="`partenaire-tile fr-col-12 fr-col-md-${12 / row.length}`"
    >
      <img
        :style="{
          mixBlendMode: 'multiply',
          maxWidth: `${(row.length === 2 ? 24 : 12)}em`,
        }"
        :src="parenaire.src"
        :alt="parenaire.alt"
        class="fr-responsive-img"
      >
    </a>
  </div>
</template>

<style scoped lang="scss">
.partenaire-tile {
  background-image: none;
  display: flex;
  justify-content: center;
  align-items: center;
  &::after {
    display: none;
  }
}
</style>
