// frontend/functions/_middleware.ts

export async function onRequest(context: any) {
  const url = new URL(context.request.url);

  // Dacă hostname-ul e pages.dev, redirect la custom domain
  if (url.hostname === "bachelor-degree.pages.dev") {
    return Response.redirect(
      `https://bachelordegree.tech${url.pathname}${url.search}`,
      301
    );
  }

  // Altfel, continuă normal
  return context.next();
}
