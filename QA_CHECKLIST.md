# AI Chatbot QA Checklist

## General
- [ ] App loads with no console errors
- [ ] User can sign up, log in, and log out
- [ ] All environment variables are loaded (no undefined errors)
- [ ] No secrets are hardcoded
- [ ] `npm run lint` and `npm run build` succeed in both frontend and backend
- [ ] All CI/CD builds pass

## File Upload & Memory
- [ ] File upload works, with progress and error feedback
- [ ] File deletion updates UI and removes memory
- [ ] Multi-user isolation: users only see their own files/memory

## Chat & LLM
- [ ] Chat works, GPT responses render, errors are handled
- [ ] OpenAI errors are logged and user-friendly messages are shown
- [ ] LLM/agent extension points are documented

## Supabase
- [ ] Vectors and files tables exist with correct schema
- [ ] RLS is enabled and policies are present for user isolation

## Frontend API
- [ ] All API calls use axios
- [ ] Data fetching uses SWR where appropriate
- [ ] UI shows loading, error, and success states for all async actions
- [ ] Error boundaries are in place 