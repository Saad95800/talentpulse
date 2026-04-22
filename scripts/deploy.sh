#!/bin/bash
# Script de déploiement automatique pour TalentPulse
# Usage: ./scripts/deploy.sh

# Arrêt immédiat en cas d'erreur
set -e

# Configuration des couleurs
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # Pas de couleur

echo -e "${BLUE}🚀 [DEPLOY] Démarrage du déploiement...${NC}"

# 1. Mise à jour du code
echo -e "${YELLOW}📥 [1/5] Récupération de la dernière version (Git pull)...${NC}"
git pull origin main

# 2. Dépendances
echo -e "${YELLOW}📦 [2/5] Installation des dépendances...${NC}"
npm install --no-audit --no-fund

# 3. Base de données
echo -e "${YELLOW}🗄️ [3/5] Synchronisation du schéma de base de données (Prisma)...${NC}"
npx prisma generate
npx prisma db push --accept-data-loss

# 4. Compilation
echo -e "${YELLOW}🏗️ [4/5] Compilation de l'application (Next.js build)...${NC}"
npm run build

# 5. Redémarrage des services
echo -e "${YELLOW}♻️ [5/5] Redémarrage des services PM2...${NC}"
pm2 restart talentpulse talentpulse-worker

echo -e "${GREEN}✅ [SUCCESS] Déploiement terminé avec succès !${NC}"
