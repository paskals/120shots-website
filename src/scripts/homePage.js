function handlePageLoad() {
  let imageElements = Array.from(document.querySelectorAll("#homepage"));

  imageElements.forEach((element) => {
    let images = JSON.parse(element.dataset.images);

    // Combine the images, alt texts, and URLs into a single array of objects
    let items = images.map((image) => {
      return {
        image: image.imageSrc,
        alt: image.alt,
        url: image.url,
      };
    });

    let imgElement = element.querySelector("img");
    let anchorElement = element.querySelector("a");

    // pick random item
    let pickedItem = items[Math.floor(Math.random() * items.length)];
    imgElement.src = pickedItem.image;
    imgElement.alt = pickedItem.alt;
    anchorElement.href = pickedItem.url;
    imgElement.classList.remove("hidden"); // Remove the 'hidden' class
  });
}

document.addEventListener("astro:page-load", handlePageLoad);
// document.addEventListener('astro:after-swap', handlePageLoad);
