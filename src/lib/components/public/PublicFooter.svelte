<script lang="ts">
  import logo from '$lib/assets/logo.png';
  import { Facebook, Mail, MapPin, Phone, Youtube } from '@lucide/svelte';
</script>

<footer class="border-t bg-muted/50">
  <div class="container mx-auto px-4 py-8">
    <div class="grid gap-8 md:grid-cols-3">
      <!-- Branding -->
      <div class="space-y-3">
        <div class="flex items-center gap-3">
          <img src={logo} alt="CATCH-UP Logo" class="size-20 rounded-lg object-contain" />
          <div class="flex flex-col">
            <span class="text-[18px] leading-tight font-bold">South Cotabato CATCH-UP</span>
            <span class="text-sm leading-tight text-muted-foreground">Convergence Data Bank</span>
          </div>
        </div>
        <p class="text-sm text-muted-foreground">
          Convergence Approach for Transformation and CHange - Unification Program. A government
          transparency portal for tracking development projects in vulnerable communities.
        </p>
      </div>

      <!-- Quick Links -->
      <div class="space-y-3">
        <h4 class="font-semibold">Quick Links</h4>
        <ul class="space-y-2 text-sm text-muted-foreground">
          <li>
            <a href="/sitios" class="transition-colors hover:text-foreground">Explore Sitios</a>
          </li>
          <li>
            <a href="/compare" class="transition-colors hover:text-foreground">Comapre</a>
          </li>

          <li>
            <a href="/login" class="transition-colors hover:text-foreground">Admin Portal</a>
          </li>
          <li>
            <a
              href="https://southcotabato.gov.ph/"
              target="_blank"
              rel="noopener noreferrer"
              class="transition-colors hover:text-foreground"
            >
              Province of South Cotabato
            </a>
          </li>
        </ul>
      </div>

      <!-- Contact -->
      <div class="space-y-3">
        <h4 class="font-semibold">Contact</h4>
        <div class="space-y-2 text-sm text-muted-foreground">
          <p class="flex items-start gap-2">
            <MapPin class="mt-0.5 size-4 shrink-0" />
            <span>Capitol Compound, Alunan Avenue, City of Koronadal, 9506</span>
          </p>
          <p class="flex items-center gap-2">
            <Phone class="size-4 shrink-0" />
            <span>09150717076 / 09654666571</span>
          </p>
          <p class="flex items-center gap-2">
            <Mail class="size-4 shrink-0" />
            <a
              href="mailto:catchupsouthcotabato@gmail.com"
              class="transition-colors hover:text-foreground"
            >
              catchupsouthcotabato@gmail.com
            </a>
          </p>
        </div>

        <!-- Social Media -->
        <div class="flex items-center gap-2 pt-2">
          <a
            href="https://www.facebook.com/profile.php?id=100087614559350"
            target="_blank"
            rel="noopener noreferrer"
            class="rounded-md p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            aria-label="Facebook"
          >
            <Facebook class="size-5" />
          </a>
          <a
            href="https://www.youtube.com/@CATCH-UPsouthcot"
            target="_blank"
            rel="noopener noreferrer"
            class="rounded-md p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            aria-label="YouTube"
          >
            <Youtube class="size-5" />
          </a>
          <a
            href="https://www.tiktok.com/@southcotabatocatchup"
            target="_blank"
            rel="noopener noreferrer"
            class="rounded-md p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            aria-label="TikTok"
          >
            <svg class="size-5" viewBox="0 0 24 24" fill="currentColor">
              <path
                d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"
              />
            </svg>
          </a>
        </div>
      </div>
    </div>

    <!-- Copyright -->
    <div class="mt-8 border-t pt-6 text-center text-sm text-muted-foreground">
      <p>
        &copy; {new Date().getFullYear()} Province of South Cotabato CATCH-UP Program. All rights reserved.
      </p>
    </div>
  </div>
</footer>
