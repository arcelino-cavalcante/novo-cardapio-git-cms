// ui.js - Custom Modals to Replace Native alerts and confirms

export function showCustomAlert(message) {
    return new Promise((resolve) => {
        const bg = document.createElement('div');
        bg.className = 'fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm px-4 animate-fade-in';
        
        const box = document.createElement('div');
        box.className = 'bg-white rounded-2xl p-6 w-full max-w-sm shadow-xl flex flex-col items-center text-center space-y-4 scale-up';
        
        const icon = document.createElement('div');
        icon.className = 'w-12 h-12 rounded-full bg-brand-100 text-brand-600 flex items-center justify-center text-xl mb-2';
        icon.innerHTML = '<i class="fa-solid fa-bell"></i>';

        const text = document.createElement('p');
        text.className = 'text-neutral-800 font-medium';
        text.textContent = message;

        const btn = document.createElement('button');
        btn.className = 'w-full bg-brand-600 hover:bg-brand-700 text-white font-bold py-3 rounded-xl transition-colors';
        btn.textContent = 'OK';

        box.appendChild(icon);
        box.appendChild(text);
        box.appendChild(btn);
        bg.appendChild(box);
        document.body.appendChild(bg);

        // Required Styles for animation if not exist
        if (!document.getElementById('ui-modal-styles')) {
            const style = document.createElement('style');
            style.id = 'ui-modal-styles';
            style.innerHTML = `
                @keyframes scaleUp { from { transform: scale(0.95); opacity: 0; } to { transform: scale(1); opacity: 1; } }
                .scale-up { animation: scaleUp 0.2s ease-out forwards; }
            `;
            document.head.appendChild(style);
        }

        btn.onclick = () => {
            bg.remove();
            resolve();
        };
    });
}

export function showCustomConfirm(message) {
    return new Promise((resolve) => {
        const bg = document.createElement('div');
        bg.className = 'fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm px-4 animate-fade-in';
        
        const box = document.createElement('div');
        box.className = 'bg-white rounded-2xl p-6 w-full max-w-sm shadow-xl flex flex-col items-center text-center space-y-4 scale-up';
        
        const icon = document.createElement('div');
        icon.className = 'w-12 h-12 rounded-full bg-brand-100 text-brand-600 flex items-center justify-center text-xl mb-2';
        icon.innerHTML = '<i class="fa-solid fa-circle-question"></i>';

        const text = document.createElement('p');
        text.className = 'text-neutral-800 font-medium';
        text.textContent = message;

        const btnGroup = document.createElement('div');
        btnGroup.className = 'w-full flex gap-3 mt-2';

        const btnCancel = document.createElement('button');
        btnCancel.className = 'flex-1 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 font-bold py-3 rounded-xl transition-colors';
        btnCancel.textContent = 'Cancelar';

        const btnOk = document.createElement('button');
        btnOk.className = 'flex-1 bg-brand-600 hover:bg-brand-700 text-white font-bold py-3 rounded-xl transition-colors';
        btnOk.textContent = 'Confirmar';

        btnGroup.appendChild(btnCancel);
        btnGroup.appendChild(btnOk);

        box.appendChild(icon);
        box.appendChild(text);
        box.appendChild(btnGroup);
        bg.appendChild(box);
        document.body.appendChild(bg);

        btnCancel.onclick = () => {
            bg.remove();
            resolve(false);
        };
        btnOk.onclick = () => {
            bg.remove();
            resolve(true);
        };
    });
}
