# How to apply the agent's changes to GitHub and Vercel

These steps assume you have write access to the repository on GitHub and want to deploy the updated code to Vercel.

## 1) Sync the latest changes locally
```bash
git clone https://github.com/Nikki72581/commissionflow.git
cd commissionflow
# If you already cloned the repo earlier
# git pull origin main
```

## 2) Create a working branch (recommended)
```bash
git checkout -b vercel-fix
```

## 3) Apply the code changes from this workspace
If you are using the downloadable zip/tar of this conversation's workspace, copy the files into your local checkout and overwrite the matching paths, or copy the diff manually.

## 4) Install dependencies and verify the build locally
```bash
npm install
npm run lint
npm run build
```

## 5) Commit and push to GitHub
```bash
git add .
git commit -m "Fix Vercel build issues and deployment instructions"
git push origin vercel-fix
```

## 6) Open a pull request and deploy
- Open a PR from `vercel-fix` into `main` on GitHub.
- Once merged, Vercel will automatically build and deploy if the project is connected to your GitHub repo.
- To trigger a redeploy without merging, you can also select the `vercel-fix` branch as the production or preview branch in the Vercel dashboard and redeploy.

## 7) If Vercel still fails to build
- Check the Vercel build logs for missing environment variables or database connectivity.
- Confirm `DATABASE_URL` and Clerk keys are configured in the Vercel project settings.
- If fonts cannot download during the build, configure local font hosting or allow network egress for Google Fonts.

Following this flow ensures your GitHub repository stays in sync with the agent's fixes and that Vercel picks up the latest code.
