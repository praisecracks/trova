/* =======================================================
   TrustLink.ng — Primary Interactions & Scroll Animations
   Handles GSAP ScrollTriggers + Interactive Story Mockups
   ======================================================= */

document.addEventListener("DOMContentLoaded", () => {
    
    // 1. Navigation backdrop blur on scroll
    const navbar = document.querySelector(".sticky-nav");
    if (navbar) {
        window.addEventListener("scroll", () => {
            if (window.scrollY > 80) {
                navbar.classList.add("scrolled");
            } else {
                navbar.classList.remove("scrolled");
            }
        });
    }

    // 2. Mobile Nav Hamburger Overlay
    const menuBtn = document.querySelector(".hamburger-trigger");
    const closeBtn = document.querySelector(".mobile-close-trigger");
    const mobileOverlay = document.querySelector(".mobile-menu-overlay");

    if (menuBtn && mobileOverlay && closeBtn) {
        menuBtn.addEventListener("click", () => {
            mobileOverlay.style.display = "flex";
        });
        closeBtn.addEventListener("click", () => {
            mobileOverlay.style.display = "none";
        });
    }

    // 3. Hero self-playing mock dashboard loop
    let activeHeroStep = 0;
    const heroSteps = document.querySelectorAll(".hero-status-pill");
    const heroDetailPanel = document.getElementById("hero-dynamic-log");

    const heroSimulations = [
        "Waiting for deposits: The buyer opened trustlink.ng checkout link and is executing payment via standard card/bank rails.",
        "₦85,000 securing: Funds successfully captured! Protected safely in GTBank Trustee vault. Merchant is notified by SMS to ship Yeezy sand boots.",
        "Awaiting Confirmation: Buyer inspected jacket and boot sizing. They have 48 hours to click confirm to finalise clearance.",
        "Disbursement Completed! Funds cleared directly to 012****342 (Guaranty Trust Bank). 100% scam proof loops completed."
    ];

    setInterval(() => {
        if (heroSteps.length > 0 && heroDetailPanel) {
            heroSteps.forEach(el => el.classList.remove("active-step"));
            activeHeroStep = (activeHeroStep + 1) % 4;
            heroSteps[activeHeroStep].classList.add("active-step");
            heroDetailPanel.innerHTML = `<strong>Status Update:</strong> ${heroSimulations[activeHeroStep]}`;
        }
    }, 4500);

    // 4. Interactive Walkthrough Frame Clicks (Section 3)
    const storyCards = document.querySelectorAll(".narrative-card");
    const phoneSimScreen = document.getElementById("phone-screen-container");

    if (storyCards) {
        storyCards.forEach((card, idx) => {
            card.addEventListener("click", () => {
                storyCards.forEach(c => c.classList.remove("active"));
                card.classList.add("active");
                updatePhoneSimulationFrame(idx);
            });
        });
    }

    function updatePhoneSimulationFrame(index) {
        if (!phoneSimScreen) return;
        // In static vanilla JS implementations, adjust class/content tags recursively
        const frames = phoneSimScreen.querySelectorAll(".phone-frame-segment");
        frames.forEach((frm, fIdx) => {
            if (fIdx === index) {
                frm.style.display = "block";
            } else {
                frm.style.display = "none";
            }
        });
    }

    // 5. GSAP Scroll Trigger Animations
    // (Ensure GSAP library is loaded beforehand via standard script source tags)
    if (typeof gsap !== "undefined" && typeof ScrollTrigger !== "undefined") {
        gsap.registerPlugin(ScrollTrigger);

        // Header animations fading
        gsap.from(".hero-title", {
            opacity: 0,
            y: 40,
            duration: 1.2,
            ease: "power3.out"
        });

        gsap.from(".hero-subtitle", {
            opacity: 0,
            y: 30,
            duration: 1,
            delay: 0.3,
            ease: "power3.out"
        });

        // Loop cards reveal triggers
        gsap.from(".earnings-card", {
            scrollTrigger: {
                trigger: ".earnings-grid",
                start: "top 80%"
            },
            y: 60,
            opacity: 0,
            duration: 0.8,
            stagger: 0.15,
            ease: "power3.out"
        });

        // Step by step timeline items fade up
        gsap.from(".step-item-scroller", {
            scrollTrigger: {
                trigger: "#how-it-works-scroll",
                start: "top 80%"
            },
            y: 40,
            opacity: 0,
            duration: 0.8,
            stagger: 0.2,
            ease: "power3.out"
        });
    }
});
