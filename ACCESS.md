# Accès privé Sitra

L’interface nécessite le mot de passe du propriétaire. Toutes les routes `/api` sont protégées côté serveur, sauf la connexion, la déconnexion et l’état de connexion. Sans configuration complète, les fonctions restent bloquées, en développement comme en production.

## Préparation privée

Exécuter `npm run access:setup`, puis ouvrir le formulaire local affiché et saisir soi-même son mot de passe. Aucun mot de passe ne doit être envoyé au chat ou à GitHub. Le formulaire génère trois réglages dans `private-access/deployment-secrets.env` et une clé distincte pour l’automatisation dans `private-access/automation-access.json`. Ces fichiers et `.env` sont exclus de Git. Le mot de passe brut n’est pas enregistré.

Avant publication, configurer `AUTH_PASSWORD_HASH`, `AUTH_SESSION_SECRET` et `AUTH_AUTOMATION_TOKEN_HASH` dans les secrets de l’hébergement, en conservant `GEMINI_API_KEY`. Ces réglages doivent rester côté serveur, sans préfixe `VITE_`. L’application vérifie les accès indépendamment du nom de domaine utilisé.

Pour un domaine personnalisé, renseigner aussi `AUTH_ALLOWED_ORIGINS` avec l’origine HTTPS exacte (par exemple `https://voice-off.ai.studio`). L’origine HTTPS de `APP_URL` est également acceptée. Ne pas utiliser de joker.

L’automatisation envoie la clé privée dans `Authorization: Bearer …`. Elle peut uniquement appeler `POST /api/generate-audio` et `GET /api/voice/status?profile=female`. Ne jamais placer la clé dans une URL. Aucun appel Gemini n’est nécessaire pour tester le verrouillage.

Les sessions du propriétaire expirent après huit heures. Le cookie de production est signé, HttpOnly, Secure et SameSite Strict. La déconnexion efface le cookie de ce navigateur. Changer `AUTH_SESSION_SECRET` invalide toutes les sessions existantes. Changer le hash de la clé d’automatisation révoque l’ancienne clé. Changer un mot de passe nécessite aussi une nouvelle clé de session. L’application doit être utilisée dans son propre onglet HTTPS, pas dans une iframe tierce.

La limitation des connexions est locale à chaque instance du serveur : cinq essais par adresse sur quinze minutes et vingt au total par instance. Elle ne remplace pas une protection distribuée si l’application devient un service multi-utilisateur. La limite Google de dépenses reste nécessaire : une personne autorisée peut toujours consommer son quota.

## Contrôles avant mise en ligne

`npm run test:access`, `npm run lint`, `npm run build`.

Après déploiement, vérifier sans génération : accès anonyme refusé, mot de passe accepté dans le navigateur du propriétaire, `/api/voice/status?profile=female` accessible avec la clé d’automatisation, création de voix refusée avec cette clé, et absence des secrets dans le code client. Une mise à jour GitHub ne prouve pas que la copie AI Studio ou le service publié a été actualisé : importer les modifications, renseigner les secrets et vérifier la version publiée avant de considérer la protection active.
