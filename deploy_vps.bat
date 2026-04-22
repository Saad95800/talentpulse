@echo off
echo ======================================================
echo 🚀 DEPLOYMENT TALENTPULSE TO VPS
echo ======================================================

echo 💾 [1/2] Synchronisation Git sur GitHub...
git add .
git commit -m "chore: deployment sync"
git push origin main

echo 🌐 [2/2] Déclenchement du script de déploiement sur le VPS...
ssh root@38.143.19.101 "cd /var/www/talentpulse && bash scripts/deploy.sh"

echo ======================================================
echo ✅ DEPLOIEMENT TERMINE !
echo ======================================================
pause
