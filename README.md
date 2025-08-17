# 우리플리 (WooriPly)

실시간 플레이리스트 투표 서비스 🎵  
사용자들이 동시에 접속하여 노래를 추천하고, 투표로 플레이리스트를 완성할 수 있는 웹 애플리케이션입니다.

---

## 📌 프로젝트 소개
우리플리는 **Next.js** 기반으로 제작된 실시간 음악 플레이리스트 투표 서비스입니다.  
로그인을 통해 참여하고, 원하는 곡을 제안하거나 다른 사용자가 제안한 곡에 투표하여 플레이리스트를 만들어갑니다.  
실시간 데이터 갱신과 직관적인 UI를 통해 친구, 동료들과 함께 음악을 즐길 수 있습니다.

---

## 🛠 기술 스택

| 분류        | 기술                                                               |
|-------------|------------------------------------------------------------------|
| **Frontend** | Next.js 14 (App Router), React 18, TypeScript, Tailwind CSS, MUI |
| **Auth**     | NextAuth.js (GitHub OAuth, Credentials)                          |
| **Backend**  | Next.js API Routes, MongoDB Atlas                                |
| **Database** | MongoDB (Mongoose)                                               |
| **Deploy**   | Vercel                                                           |
| **Etc.**     | ESLint, Prettier                                                 |

---

## ✨ 주요 기능

- **소셜 로그인**
    - GitHub 계정으로 간편 로그인 (로그인 정보 DB 저장)
    - NextAuth Credentials 로그인 지원

- **방 생성 & 참여**
    - 방을 만들고 초대 링크로 다른 사용자를 초대 가능
    - 로그인하지 않은 사용자는 방 접속 시 메인으로 리다이렉트 → 로그인 후 원래 방으로 재접속 처리

- **에러 처리**
    - 존재하지 않는 방 접근 시 `404 Not Found` 처리
    - 미인증 사용자는 API 요청 시 `401 Unauthorized` 응답 반환

- **UI/UX**
    - Tailwind CSS + MUI 조합으로 직관적인 인터페이스 구현
    - 폼 검증은 Formik + Yup 적용