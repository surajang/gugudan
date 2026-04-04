# 구구단 게임 PWA (Gugudan Game)

빠르고 직관적인 숫자 패드 입력 방식으로 구구단 실력을 측정하는 게임입니다. Progressive Web App(PWA) 기술이 적용되어 오프라인 환경에서도 동작하며, 모바일의 홈 화면에 추가하여 앱처럼 사용할 수 있습니다.

## 🚀 필수 환경 및 요구사항
프로젝트를 로컬에서 구동 및 배포하기 위해 아래의 환경이 필요합니다.

- **Node.js**: `v18` 또는 `v20+` (의존성 패키지 관리 및 로컬 개발 환경 구동)
- **Docker & Docker Compose**: 애플리케이션의 컨테이너 이미지 빌드 및 Nginx를 통한 서비스 배포

## 💻 로컬 개발 환경 세팅
1. 패키지 설치:
   ```bash
   npm install
   ```
2. 개발 서버 실행:
   ```bash
   npm run dev
   ```
   실행 후 브라우저에서 터미널에 표시된 로컬 주소(보통 `http://localhost:5173`)로 접속합니다.

## 🛠️ 빌드 (Build)
서비스 배포를 위해 정적 파일들을 빌드하려면 아래 명령어를 사용합니다:
```bash
npm run build
```
빌드가 완료되면 `dist/` 폴더 내에 최적화된 앱 결과물들이 생성됩니다.

## 🚢 배포 (Deployment)
이 프로젝트는 Docker 컨테이너 레벨로 빌드한 후 Nginx를 거쳐 서빙되도록 구성되어 있습니다. 프로젝트 내 `Dockerfile`과 `docker-compose.yml`을 활용하여 간단하게 배포할 수 있습니다.

```bash
# Docker 이미지를 빌드하고 컨테이너를 백그라운드 모드에서 실행합니다.
docker-compose up -d --build

# 실행 중인 컨테이너 종료 및 정리
docker-compose down
```

---

## 🤖 기여 (AI Assistance)
이 프로젝트 구현을 위해 **Antigravity**에서 **Claude Sonnet 4.6**, **Gemini 3.1 Pro(Low)** 를 사용했습니다.

---
<br>

# Gugudan Game PWA (Multiplication Table Game)

A game to measure your multiplication table skills with a fast and intuitive numeric keypad input. Built with Progressive Web App (PWA) technology, it works offline and can be added to your mobile home screen to be used like a native app.

## 🚀 Prerequisites
To run and deploy the project locally, the following environment is required:

- **Node.js**: `v18` or `v20+` (for dependency management and local development server)
- **Docker & Docker Compose**: For building container images and deploying via Nginx

## 💻 Local Development Setup
1. Install dependencies:
   ```bash
   npm install
   ```
2. Start the development server:
   ```bash
   npm run dev
   ```
   After starting, access the local address shown in your terminal (usually `http://localhost:5173`) in your browser.

## 🛠️ Build
To build static files for deployment, use the following command:
```bash
npm run build
```
Once the build is complete, the optimized app assets will be generated in the `dist/` folder.

## 🚢 Deployment
This project is configured to be built as a Docker container and served via Nginx. You can easily deploy it using the `Dockerfile` and `docker-compose.yml` provided in the repository.

```bash
# Build the Docker image and run the container in background mode
docker-compose up -d --build

# Stop and remove the running container
docker-compose down
```

---

## 🤖 AI Assistance
This project was implemented with the assistance of **Claude Sonnet 4.6** and **Gemini 3.1 Pro(Low)** via **Antigravity**.
