# 우리플리 (WooriPly)

실시간 플레이리스트 투표 서비스 🎵  
사용자들이 동시에 접속하여 노래를 추천하고, 투표로 플레이리스트를 완성할 수 있는 웹 애플리케이션입니다.

---

## 📌 프로젝트 소개
친구, 동료들과 함께 실시간으로 플레이리스트를 만들어가는 서비스입니다.  
Next.js와 Ably Realtime을 기반으로 **실시간 데이터 동기화**를 구현했고,  
MongoDB Atlas를 활용해 **방 생성·참여 및 곡/투표 데이터를 안정적으로 관리**합니다.  
또한 Spotify API를 통해 원하는 곡을 검색·추천하고, 투표로 최종 목록을 확정할 수 있습니다.

---

## 🛠 기술 스택

| 분류        | 기술                                                                 |
|-------------|----------------------------------------------------------------------|
| **Frontend** | Next.js 14, React 18, TypeScript, Tailwind CSS, MUI |
| **Auth**     | NextAuth.js (GitHub OAuth) |
| **Realtime** | Ably Realtime |
| **Backend**  | Next.js API Routes, MongoDB Atlas |
| **Deploy**   | Vercel |

---

## ✨ 주요 기능

- **소셜 로그인** : GitHub 계정으로 간편 로그인
- **방 생성 & 참여** : 초대 링크로 실시간 방 참여
- **실시간 상태 관리** : Ably Realtime 기반 턴 진행 & 채팅
- **곡 추천 & 투표** : Spotify API 검색 → 투표로 플레이리스트 확정
- **UI/UX** : Tailwind + MUI 조합, 반응형 레이아웃